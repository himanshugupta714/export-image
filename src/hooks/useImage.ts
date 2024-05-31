import { useState } from "react";
import sampleImage from "./sample.webp";

export const useImage = () => {
  const [image, setImage] = useState<string | ArrayBuffer | null>(sampleImage);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return { image, handleImageUpload };
};
