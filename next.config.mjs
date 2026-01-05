/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['res.cloudinary.com', 'picsum.photos'],
    },
    experimental: {
        forceSwcTransforms: true, // Force SWC even when Babel is detected
    },
};

export default nextConfig;
