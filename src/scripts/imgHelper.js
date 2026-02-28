// Configuración de Cloudinary Helper
const CLOUDINARY_CLOUD_NAME = "dr5knskbb";

export const getCloudinaryImageUrl = (publicId, { w = 600, h = 600 } = {}) => {
	if (!publicId) return "";
	const encoded = encodeURIComponent(publicId).replace(/%2F/g, "/");
	return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/c_limit,w_${w},h_${h},q_auto,f_auto/v1/${encoded}`;
};