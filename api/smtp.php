<?php
/** Minimal dependency-free SMTP client for Gmail/standard SMTP servers. */
function smtp_expect($socket, array $codes): string
{
    $response = '';
    while (!feof($socket)) {
        $line = fgets($socket, 515);
        if ($line === false) break;
        $response .= $line;
        if (isset($line[3]) && $line[3] === ' ') break;
    }
    $code = (int)substr($response, 0, 3);
    if (!in_array($code, $codes, true)) throw new RuntimeException('SMTP error: ' . trim($response));
    return $response;
}
function smtp_command($socket, string $command, array $codes): string
{
    fwrite($socket, $command . "\r\n");
    return smtp_expect($socket, $codes);
}
function smtp_send_mail(array $cfg, string $to, string $subject, string $body, string $replyTo = ''): void
{
    $host = trim((string)$cfg['host']);
    $port = (int)$cfg['port'];
    $encryption = strtolower((string)$cfg['encryption']);
    $transport = $encryption === 'ssl' ? 'ssl://' . $host : $host;
    $errno = 0; $errstr = '';
    $socket = @fsockopen($transport, $port, $errno, $errstr, 15);
    if (!$socket) throw new RuntimeException('SMTP connection failed: ' . ($errstr ?: 'connection refused'));
    stream_set_timeout($socket, 15);
    try {
        smtp_expect($socket, [220]);
        $helo = preg_replace('/[^a-zA-Z0-9.\-]/', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost')) ?: 'localhost';
        smtp_command($socket, 'EHLO ' . $helo, [250]);
        if ($encryption === 'tls') {
            smtp_command($socket, 'STARTTLS', [220]);
            $crypto = stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            if ($crypto !== true) throw new RuntimeException('STARTTLS could not be enabled.');
            smtp_command($socket, 'EHLO ' . $helo, [250]);
        }
        $username = trim((string)$cfg['username']);
        $password = preg_replace('/\s+/', '', (string)$cfg['password']);
        if ($username === '' || $password === '') throw new RuntimeException('SMTP Gmail এবং App Password সেট করা হয়নি।');
        smtp_command($socket, 'AUTH LOGIN', [334]);
        smtp_command($socket, base64_encode($username), [334]);
        smtp_command($socket, base64_encode($password), [235]);
        smtp_command($socket, 'MAIL FROM:<' . $username . '>', [250]);
        smtp_command($socket, 'RCPT TO:<' . $to . '>', [250,251]);
        smtp_command($socket, 'DATA', [354]);
        $fromName = trim((string)$cfg['from_name']) ?: 'শান্তি সংঘ Website';
        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $headers = [
            'From: =?UTF-8?B?' . base64_encode($fromName) . '?= <' . $username . '>',
            'To: <' . $to . '>',
            $replyTo !== '' ? 'Reply-To: ' . $replyTo : '',
            'Subject: ' . $encodedSubject,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
            'Date: ' . date(DATE_RFC2822),
            'X-Mailer: Shanti Sangha Website',
        ];
        $headers = array_values(array_filter($headers));
        $normalizedBody = str_replace(["\r\n", "\r"], "\n", $body);
        $normalizedBody = preg_replace('/^\./m', '..', $normalizedBody);
        fwrite($socket, implode("\r\n", $headers) . "\r\n\r\n" . $normalizedBody . "\r\n.\r\n");
        smtp_expect($socket, [250]);
        smtp_command($socket, 'QUIT', [221]);
    } finally {
        fclose($socket);
    }
}
