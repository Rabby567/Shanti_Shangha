/**
 * Short mission statement displayed directly below the hero.
 */
export function QuoteStrip() {
  return (
    <section className="quote-strip" aria-label="সংগঠনের বার্তা">
      <div className="container quote-inner">
        <div>
          <b>মানুষ মানুষের জন্য ❤️</b>
          <span>
            আপনার ছোট একটি সহযোগিতা কারও জীবনে বড় একটি পরিবর্তন আনতে পারে।
          </span>
        </div>

        <span className="quote-mark" aria-hidden="true">
          “
        </span>
      </div>
    </section>
  );
}
