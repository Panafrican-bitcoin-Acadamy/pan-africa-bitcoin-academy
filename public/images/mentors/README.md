# Mentor Images

This directory contains profile images for mentors displayed on the website.

## Expected Images

- `yohannes-amanuel.jpg` - Profile image for Yohannes Amanuel
- `semir-omer.jpg` - Profile image for Semir Omer  
- `ojokne.jpg` - Profile image for Ojok Emmanuel Nsubuga

## Image Guidelines

- **Format**: JPG or PNG
- **Recommended Size**: 400x400px minimum
- **Aspect Ratio**: Square (1:1)
- **File Size**: Keep under 200KB for optimal loading
- **Quality**: High quality but optimized for web

## Fallback Behavior

If mentor images are not available, the website will display a default avatar icon (👤) instead. This ensures the site remains functional even without images.

## Adding New Mentor Images

1. Add the image file to this directory
2. Name it following the pattern: `firstname-lastname.jpg` (lowercase, hyphens)
3. Update the mentor record in the database or fallback data to reference the image path: `/images/mentors/firstname-lastname.jpg`

