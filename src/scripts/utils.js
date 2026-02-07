export function formatFromThousands(value) {
  const num = Number(value);

  if (isNaN(num)) return "";

  return Math.floor(num / 1000).toString();
}

export const cloudinaryUrl = (id) => {
  return `https://res.cloudinary.com/dc8vxeapd/image/upload/w_400,q_auto,f_auto/${id}.jpg`;
}


export const cloudinaryReviews = (id) => {
  return `https://res.cloudinary.com/dc8vxeapd/image/upload/w_48,q_auto,f_auto/${id}.png`;
}
