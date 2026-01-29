export function formatFromThousands(value) {
  const num = Number(value);

  if (isNaN(num)) return "";

  return Math.floor(num / 1000).toString();
}

export function cloudinaryUrl(id) {
  return `https://res.cloudinary.com/dc8vxeapd/image/upload/w_400,q_auto,f_auto/${id}.jpg`;
}
