// lib/cloudinary.js

export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error('Cloudinary upload failed');
  }

  const data = await res.json();
  return data.secure_url; // ✅ This is the public image URL you should store in Firebase
}

export async function deleteFromCloudinary(imageUrl) {
  try {
    // Extract public_id from the image URL
    const urlParts = imageUrl.split('/');
    const publicIdWithExtension = urlParts[urlParts.length - 1]; // e.g., "image_name.jpg"
    const publicId = publicIdWithExtension.split('.')[0]; // Remove the file extension

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY; // Ensure this is set in your .env
    const apiSecret = process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET; // Ensure this is set in your .env

    // Create the signature for authentication
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signatureString = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const crypto = await import('crypto'); // Dynamic import for Node.js crypto
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!res.ok) {
      throw new Error('Cloudinary deletion failed');
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
}