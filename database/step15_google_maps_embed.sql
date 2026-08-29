-- Step 15: Store exact Google Maps Embed URL
INSERT INTO site_settings (setting_key, setting_value)
VALUES ('site_map_embed_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d901.8938851531643!2d89.22123638610354!3d24.975387869154122!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fcf7004f502853%3A0xd1f25d81589c19f9!2zU2hhbnRpIFNhbmdoYSAo4Ka24Ka-4Kao4KeN4Kak4Ka_IOCmuOCmguCmmCDgpq_gp4Hgpqwg4Ka44Kau4Ka-4KacIOCmleCmsuCnjeCmr-CmvuCmoyDgpqrgprDgpr_gprfgpqYpLCDgpqrgpr_gprDgpqwg4Kas4Ka-4Kac4Ka-4Kaw!5e1!3m2!1sen!2sbd!4v1788000871915!5m2!1sen!2sbd')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
