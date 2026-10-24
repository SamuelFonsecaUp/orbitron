const fs = require('fs');
const path = require('path');
const { dialog } = require('electron');

async function exportCanvasImage(defaultName, format, dataUrlOrSvg, mainWindow) {
  const ext = format === 'svg' ? 'svg' : 'png';
  const filterName = format === 'svg' ? 'Imagem Vetorial SVG (*.svg)' : 'Imagem PNG (*.png)';
  const baseName = defaultName ? path.basename(defaultName, path.extname(defaultName)) : 'quadro';

  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: `Exportar Quadro como ${format.toUpperCase()}`,
    defaultPath: `${baseName}.${ext}`,
    filters: [
      { name: filterName, extensions: [ext] },
      { name: 'Todos os Arquivos (*.*)', extensions: ['*'] },
    ],
  });

  if (canceled || !filePath) {
    return { success: false, canceled: true };
  }

  if (format === 'svg') {
    fs.writeFileSync(filePath, dataUrlOrSvg, 'utf8');
  } else {
    // Strip data URL header if present
    const base64Data = dataUrlOrSvg.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
  }

  return { success: true, filePath };
}

module.exports = { exportCanvasImage };
