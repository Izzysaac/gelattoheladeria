const divisions = [
  { amount: 30, name: "days" },
  { amount: 12, name: "months" },
  { amount: Infinity, name: "years" },
];
const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
const now = new Date();

export const timeAgo = (dateString) => {
  const past = new Date(dateString);
  const diffSeconds = Math.floor((past - now) / 86400000);

  let duration = diffSeconds;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.trunc(duration), division.name);
    }
    duration /= division.amount;
  }
};
