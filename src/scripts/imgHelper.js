// Configuración de Cloudinary Helper
const CLOUDINARY_CLOUD_NAME = "dr5knskbb";

export const getCloudinaryImageUrl = (publicId,  { w = 480, h = 480, c = "limit" } = {}) => {
	if (!publicId) return "";
	const encoded = encodeURIComponent(publicId).replace(/%2F/g, "/");
	return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/c_limit,w_${w}/f_auto/q_auto/v1/${encoded}`;
};

export const getCloudinaryImageUrlSameMenu = (publicId, { w = 480, h = 480, c = "limit" } = {}) => {
	if (!publicId) return "";
	const encoded = encodeURIComponent(publicId).replace(/%2F/g, "/");
	return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/c_${c},w_${w}/f_auto/q_auto/v1/${encoded}`;
};

