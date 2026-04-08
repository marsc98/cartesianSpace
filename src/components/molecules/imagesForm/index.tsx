import React, { useState } from 'react';
import css from "./index.module.scss";
import Input from '../../atoms/input';
import Button from '../../atoms/button';
import Icon from '../../atoms/icon';
import IconButton from '../iconButton';
import { safeSetItem, safeGetParsed, isValidSavedImages } from '../../../utils/storage';

interface SavedImage {
  id: string;
  name: string;
  data: string;
  date: string;
  createdAt: string;
}

interface ImagesFormProps {
  addImageToScene: (id: string) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

function ImagesForm({ addImageToScene }: ImagesFormProps) {
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Carrega imagens salvas ao montar o componente
  React.useEffect(() => {
    const storedImages = safeGetParsed('savedImages', isValidSavedImages);
    if (storedImages) setSavedImages(storedImages);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setUploadError('Arquivo muito grande. Tamanho máximo: 2MB.');
        return;
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setUploadError('Tipo de arquivo não permitido. Use PNG, JPEG, WebP ou GIF.');
        return;
      }

      setImageName(file.name);

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Converter para Base64
      const base64Reader = new FileReader();
      base64Reader.onloadend = () => {
        if (typeof base64Reader.result === 'string') setImage(base64Reader.result);
      };
      base64Reader.readAsDataURL(file);
    }
  };

  const handleSaveImage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!image) {
      alert("Nenhuma imagem selecionada!");
      return;
    }

    // Criar objeto com metadados da imagem
    const imageData = {
      id: imageName + Date.now(),
      createdAt: new Date().toISOString(),
      name: imageName || `image_${Date.now()}`,
      data: image,
      date: new Date().toISOString()
    };

    // Atualizar lista de imagens salvas
    const updatedImages = [...savedImages, imageData];
    setSavedImages(updatedImages);

    // Salvar no localStorage
    safeSetItem('savedImages', JSON.stringify(updatedImages));

    addImageToScene(imageData.id);

    // Resetar formulário
    setImage(null);
    setPreview(null);
    setImageName('');
    const uploadInput = document.getElementById("image-upload") as HTMLInputElement | null;
    if (uploadInput) uploadInput.value = "";

    alert("Imagem salva com sucesso!");
  };

  const handleDeleteImage = (id: string) => {
    const filteredImages = savedImages.filter(img => img.id !== id);
    setSavedImages(filteredImages);
    safeSetItem('savedImages', JSON.stringify(filteredImages));
  };

  return (
    <div className={css["image-upload-container"]}>
      <form onSubmit={handleSaveImage} className={css["image-upload-form"]}>
        <h2>Upload de Imagem</h2>

        {uploadError && (
          <p role="alert" style={{ color: 'red', fontSize: '0.85em' }}>{uploadError}</p>
        )}

        <div className={css["form-group"]}>
          <label htmlFor="image-upload" className={css["upload-label"]}>
            Selecione uma imagem
          </label>
          <Input
            className={css["file-input"]}
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            aria-required="true"
          />
        </div>

        {preview && (
          <div className={css["preview-container"]}>
            <h3>Pré-visualização:</h3>
            <img
              src={preview}
              alt="Preview"
              className={css["image-preview"]}
            />
            <Input
              type="text"
              placeholder="Nome da imagem (opcional)"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
              className={css["name-input"]}
            />
          </div>
        )}

        <Button
          type="submit"
          disabled={!image}
          className={css["save-button"]}
          text="Salvar Imagem"
        />
      </form>

      <div className={css["saved-images"]}>
        <h2>Imagens Salvas</h2>
        {savedImages.length === 0 ? (
          <p>Nenhuma imagem salva ainda.</p>
        ) : (
          <ul className={css["image-list"]}>
            {savedImages.map((img) => (
              <li key={img.id} className={css["image-item"]}>
                <div className={css["image-info"]}>
                  <span>{img.name}</span>
                  <span>{new Date(img.date).toLocaleString()}</span>
                </div>
                <div className={css["image-actions"]}>
                  <IconButton hoverText="Copiar Base64" iconName="copy" size="p" onClick={() => navigator.clipboard.writeText(img.data)} />
                  <IconButton hoverText="Deletar" iconName="delete" size="p" onClick={() => handleDeleteImage(img.id)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ImagesForm;
