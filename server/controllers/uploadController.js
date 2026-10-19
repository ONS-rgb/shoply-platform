const fs = require('fs');
const path = require('path');

// Dossier de stockage des uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// POST /api/upload
// Accepte { image: 'data:image/...;base64,...' } ou { images: [...] }
exports.uploadImage = async (req, res) => {
  try {
    const { image, images } = req.body;

    const saveBase64 = (base64Str) => {
      // Déterminer l'extension
      const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let ext = 'jpg';
      let data = base64Str;

      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('gif')) ext = 'gif';
        else if (mime.includes('svg')) ext = 'svg';
        data = matches[2];
      }

      const filename = `img_${Date.now()}_${Math.floor(Math.random() * 100000)}.${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

      // URL accessible publiquement
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      return `${baseUrl}/uploads/${filename}`;
    };

    if (images && Array.isArray(images)) {
      const urls = images.map((img) => (img.startsWith('data:') ? saveBase64(img) : img));
      return res.json({ success: true, urls });
    }

    if (!image) {
      return res.status(400).json({ success: false, message: 'Aucune image fournie' });
    }

    if (!image.startsWith('data:')) {
      // Si c'est déjà une URL HTTP valide
      return res.json({ success: true, url: image });
    }

    const fileUrl = saveBase64(image);
    return res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Erreur téléversement image:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
