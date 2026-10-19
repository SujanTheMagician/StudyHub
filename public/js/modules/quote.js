// Sujan – Daily Quote
//
// Shows one quote per day. The quote comes from the DummyJSON quotes API,
// is kept for the rest of the day, and falls back to a built-in quote
// if the student is offline.

const QUOTE_API_URL = "https://dummyjson.com/quotes/";
const QUOTE_API_TOTAL = 1454;

const QUOTE_FALLBACKS = [
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    text: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "Small steps every day add up to big results.", author: "Unknown" },
];

const quoteText = document.getElementById("quote-text");
const quoteAuthor = document.getElementById("quote-author");

// Today's date as "YYYY-MM-DD"
function getQuoteToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

// The same number for everyone on the same day, a new number tomorrow
function getQuoteDayNumber() {
  const now = new Date();
  return Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000,
  );
}

function showQuote(quote) {
  quoteText.textContent = "“" + quote.text + "”";
  quoteAuthor.textContent = "— " + quote.author;
}

function loadDailyQuote() {
  const today = getQuoteToday();
  const saved = loadData("quote");

  if (saved.date === today) {
    showQuote(saved);
    return;
  }

  const quoteId = (getQuoteDayNumber() % QUOTE_API_TOTAL) + 1;

  fetch(QUOTE_API_URL + quoteId)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Quote API returned " + response.status);
      }
      return response.json();
    })
    .then(function (data) {
      const quote = { date: today, text: data.quote, author: data.author };
      saveData("quote", quote);
      showQuote(quote);
    })
    .catch(function () {
      showQuote(QUOTE_FALLBACKS[getQuoteDayNumber() % QUOTE_FALLBACKS.length]);
    });
}

loadDailyQuote();
