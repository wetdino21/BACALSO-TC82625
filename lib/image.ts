
interface CompressImageOptions {
  file: File;
  maxWidth: number;
  maxHeight: number;
  quality?: number;
}

export const compressImage = (options: CompressImageOptions): Promise<string> => {
  return new Promise((resolve, reject) => {
    const { file, maxWidth, maxHeight, quality = 0.8 } = options;
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      if (!event.target?.result) {
        return reject(new Error("Couldn't read file."));
      }
      img.src = event.target.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(file.type, quality);
        resolve(dataUrl);
      };

      img.onerror = (error) => {
        reject(error);
      };
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
};
