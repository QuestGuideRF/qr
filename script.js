const textInput = document.getElementById('textInput');
const generateBtn = document.getElementById('generateBtn');
const qrResult = document.getElementById('qrResult');
const downloadSection = document.getElementById('downloadSection');
const downloadBtn = document.getElementById('downloadBtn');
const sizeSelect = document.getElementById('sizeSelect');
const colorSelect = document.getElementById('colorSelect');
const charCounter = document.querySelector('.char-counter');
const colorLabel = document.querySelector('.color-label');
let currentQRCanvas = null;
const colorNames = {
    '#000000': 'Чёрный',
    '#ffffff': 'Белый',
    '#ff0000': 'Красный',
    '#00ff00': 'Зелёный',
    '#0000ff': 'Синий',
    '#ffff00': 'Жёлтый',
    '#ff00ff': 'Розовый',
    '#00ffff': 'Голубой',
    '#800080': 'Фиолетовый',
    '#ffa500': 'Оранжевый'
};
document.addEventListener('DOMContentLoaded', function() {
    textInput.addEventListener('input', updateCharCounter);
    textInput.addEventListener('input', debounce(handleInputChange, 500));
    generateBtn.addEventListener('click', generateQR);
    downloadBtn.addEventListener('click', downloadQR);
    colorSelect.addEventListener('change', updateColorLabel);
    textInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            generateQR();
        }
    });
    updateCharCounter();
    updateColorLabel();
});
function updateCharCounter() {
    const length = textInput.value.length;
    const maxLength = textInput.getAttribute('maxlength');
    charCounter.textContent = `${length} / ${maxLength}`;
    if (length > maxLength * 0.9) {
        charCounter.style.color = '#e53e3e';
    } else if (length > maxLength * 0.7) {
        charCounter.style.color = '#dd6b20';
    } else {
        charCounter.style.color = '#718096';
    }
}
function updateColorLabel() {
    const selectedColor = colorSelect.value.toLowerCase();
    colorLabel.textContent = colorNames[selectedColor] || 'Пользовательский';
}
function handleInputChange() {
    const text = textInput.value.trim();
    if (isValidURL(text) && text.length > 10) {
        generateQR();
    }
}
function isValidURL(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
async function generateQR() {
    const text = textInput.value.trim();
    if (!text) {
        showError('Пожалуйста, введите текст или ссылку');
        return;
    }
    showLoading();
    try {
        const size = parseInt(sizeSelect.value);
        const color = colorSelect.value;
        const options = {
            width: size,
            height: size,
            color: {
                dark: color,
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M',
            type: 'image/png',
            quality: 0.92,
            margin: 2,
        };
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, text, options);
        showResult(canvas);
        downloadSection.style.display = 'block';
        qrResult.classList.add('fade-in');
    } catch (error) {
        console.error('Ошибка генерации QR-кода:', error);
        showError('Произошла ошибка при генерации QR-кода. Попробуйте ещё раз.');
    }
}
function showLoading() {
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Создаём...';
    qrResult.innerHTML = `
        <div class="placeholder">
            <i class="fas fa-spinner fa-spin placeholder-icon"></i>
            <p>Генерируем QR-код...</p>
        </div>
    `;
    qrResult.classList.remove('has-qr');
}
function showResult(canvas) {
    currentQRCanvas = canvas;
    qrResult.innerHTML = '';
    qrResult.appendChild(canvas);
    qrResult.classList.add('has-qr');
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fas fa-magic"></i> Создать QR-код';
    showQRInfo();
}
function showQRInfo() {
    const text = textInput.value.trim();
    const size = sizeSelect.value;
    const isURL = isValidURL(text);
    const infoDiv = document.createElement('div');
    infoDiv.className = 'qr-info';
    infoDiv.innerHTML = `
        <div style="margin-top: 15px; padding: 10px; background: #f7fafc; border-radius: 8px; font-size: 0.9rem; color: #4a5568;">
            <div><strong>Размер:</strong> ${size}×${size} пикселей</div>
            <div><strong>Тип:</strong> ${isURL ? 'URL-ссылка' : 'Текст'}</div>
            <div><strong>Символов:</strong> ${text.length}</div>
        </div>
    `;
    qrResult.appendChild(infoDiv);
}
function showError(message) {
    qrResult.innerHTML = `
        <div class="placeholder">
            <i class="fas fa-exclamation-triangle placeholder-icon" style="color: #e53e3e;"></i>
            <p style="color: #e53e3e;">${message}</p>
        </div>
    `;
    qrResult.classList.remove('has-qr');
    downloadSection.style.display = 'none';
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fas fa-magic"></i> Создать QR-код';
}
function downloadQR() {
    if (!currentQRCanvas) {
        showError('Сначала создайте QR-код');
        return;
    }
    try {
        const link = document.createElement('a');
        link.download = `qr-код-${Date.now()}.png`;
        link.href = currentQRCanvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showDownloadSuccess();
    } catch (error) {
        console.error('Ошибка скачивания:', error);
        showError('Произошла ошибка при скачивании. Попробуйте ещё раз.');
    }
}
function showDownloadSuccess() {
    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<i class="fas fa-check"></i> Скачано!';
    downloadBtn.style.background = '#48bb78';
    setTimeout(() => {
        downloadBtn.innerHTML = originalText;
        downloadBtn.style.background = '#48bb78';
    }, 2000);
}
function copyQRToClipboard() {
    if (!currentQRCanvas) return;
    currentQRCanvas.toBlob(blob => {
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => {
            console.log('QR-код скопирован в буфер обмена');
        });
    });
}
const examples = [
    'https://www.google.com',
    'https://www.youtube.com',
    'Привет, мир!',
    'Это пример QR-кода',
    'mailto:example@email.com',
    'tel:+7-900-123-45-67'
];
function insertExample() {
    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    textInput.value = randomExample;
    updateCharCounter();
    generateQR();
}
function validateInput(text) {
    if (text.length === 0) {
        return { valid: false, message: 'Введите текст или ссылку' };
    }
    if (text.length > 2000) {
        return { valid: false, message: 'Текст слишком длинный (максимум 2000 символов)' };
    }
    return { valid: true };
}
function saveSettings() {
    const settings = {
        size: sizeSelect.value,
        color: colorSelect.value
    };
    localStorage.setItem('qr-generator-settings', JSON.stringify(settings));
}
function loadSettings() {
    const saved = localStorage.getItem('qr-generator-settings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            if (settings.size) sizeSelect.value = settings.size;
            if (settings.color) colorSelect.value = settings.color;
            updateColorLabel();
        } catch (e) {
            console.log('Не удалось загрузить сохранённые настройки');
        }
    }
}
sizeSelect.addEventListener('change', saveSettings);
colorSelect.addEventListener('change', saveSettings);
document.addEventListener('DOMContentLoaded', loadSettings);