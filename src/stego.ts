import * as fs from 'node:fs';

/**
 * Перечисление позиций для встраивания скрытой информации.
 * @enum {number}
 */
enum Position {
    TOP,
    BOTTOM,
    RANDOM,
    NTHLINES,
    RANDOMINLINE,
}

/**
 * Класс StegoUTF8 предоставляет методы для скрытия и извлечения информации
 * с использованием метода Zero-Width Space.
 */
class StegoUTF8 {
    /**
     * Хранилище символов для кодирования и декодирования.
     * @type {object}
     * @private
     */
    private readonly character_map: { [key: string]: string } = {
        '0': '\u200B', // ZERO WIDTH SPACE
        '1': '\uFEFF', // ZERO WIDTH NO-BREAK SPACE
    };

    /**
     * Отображение для обратного отображения символов.
     * @type {object}
     * @private
     */
    private readonly space_map: { [key: string]: string } = {};

    /**
     * Сет для скрытых символов.
     * @type {Set<string>}
     * @private
     */
    private readonly hidden_characters!: Set<string>;


    /**
     * Конструктор класса StegoUTF8.
     * Инициализирует отображение пространства и скрытые символы.
     * @constructor
     */
    constructor () {
        for (const key in this.character_map) {
            if (Object.prototype.hasOwnProperty.call(this.character_map, key)) {
                const value = this.character_map[key];
                this.space_map[value] = key;
            }
        }
        this.hidden_characters = new Set(Object.values(this.character_map));
    };


    /**
     * Метод для кодирования сообщения в Zero-Width Space.
     * @param {string} clear - Открытый текст для скрытия.
     * @returns {string} Закодированная строка.
     * @private
     */
    private spaceEncode (clear: string): string {
        if (clear.length === 0) return '';

        const binary: string = clear
            .split('')
            .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
            .join('');
        return [...binary]
            .map((bit) => this.character_map[bit])
            .join('');
    };


    /**
     * Метод для декодирования сообщения из Zero-Width Space.
     * @param {string} encoded - Закодированная строка.
     * @returns {string} Раскодированный текст.
     * @private
     */
    private spaceDecode (encoded: string): string {
        if (encoded.length === 0) return '';

        const binary: string = [...encoded]
            .map((char) => this.space_map[char])
            .join('');
        const decoded = binary
            .match(/.{8}/g)
            ?.map((byte) => String.fromCharCode(parseInt(byte, 2)))
            .join('');
        return decoded || '';
    };


    /**
     * Метод для скрытия данных в тексте.
     * @param {string} source - Исходный текст.
     * @param {string} clear - Данные для скрытия.
     * @param {Position} position - Позиция для скрытия.
     * @param {number} [k=1] - Количество встраиваний.
     * @returns {string} Текст с внедренными данными.
     */
    public zeroEncode (
        source: string,
        clear: string,
        position: Position,
        k: number = 1
    ): string {
        const encoded: string = this.spaceEncode(clear);

        let embedded: string;
        let count = 0;

        switch (position) {
            case Position.TOP:
                embedded = encoded + source;
                break;
            case Position.BOTTOM:
                embedded = source + encoded;
                break;
            case Position.RANDOM:
                while (count < k) {
                    const randomIndex = Math.floor(Math.random() * source.length);
                    if (!this.hidden_characters.has(source[randomIndex])) {
                        source =
                            source.slice(0, randomIndex) +
                            encoded +
                            source.slice(randomIndex);
                        count++;
                    }
                }
                embedded = source;
                break;
            case Position.NTHLINES:
                const lines = source.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    if (count === k) {
                        lines[i] += encoded;
                        count = 0;
                    }
                    count++;
                }
                embedded = lines.join('\n');
                break;
            case Position.RANDOMINLINE:
                const inlineLines = source.split('\n');
                for (let i = 0; i < inlineLines.length; i += k) {
                    const randomIndex = Math.floor(Math.random() * inlineLines[i].length);
                    inlineLines[i] =
                        inlineLines[i].slice(0, randomIndex) +
                        encoded +
                        inlineLines[i].slice(randomIndex);
                }
                embedded = inlineLines.join('\n');
                break;
            default:
                embedded = source;
                break;
        }

        return embedded;
    };

    /**
     * Метод для извлечения скрытых данных из текста.
     * @param {string} source - Текст с внедренными данными.
     * @returns {string} Извлеченные данные.
     */
    public zeroDecode (source: string): string {
        const encoded: string = [...source].filter((char) =>
            this.hidden_characters.has(char)
        ).join('');
        return this.spaceDecode(encoded);
    };

    /**
     * Метод для скрытия данных из файла.
     * @param {string} source_path - Путь к исходному файлу.
     * @param {string} clear - Данные для скрытия.
     * @param {Position} position - Позиция для скрытия.
     * @param {number} [k=1] - Количество встраиваний.
     * @returns {string} Текст с внедренными данными.
     */
    public zeroEncodeFile (
        source_path: string,
        clear: string,
        position: Position,
        k: number = 1
    ): string {
        let source: string = '';
        try {
            source = fs.readFileSync(source_path, { encoding: 'utf-8' });
        } catch (error) {
            throw new Error('Unable to read the source file');
        }

        return this.zeroEncode(source, clear, position, k);
    };

    /**
     * Метод для извлечения скрытых данных из файла.
     * @param {string} source_path - Путь к файлу с внедренными данными.
     * @returns {string} Извлеченные данные.
     */
    public zeroDecodeFile (source_path: string): string {
        let source: string = '';
        try {
            source = fs.readFileSync(source_path, { encoding: 'utf-8' });
        } catch (error) {
            throw new Error('Unable to read the source file');
        }

        return this.zeroDecode(source);
    };


    /**
     * Метод для очистки скрытых данных из строки.
     * @param {string} source - Строка со скрытыми данными.
     * @returns {string} Очищенная строка.
     */
    public cleanString (source: string): string {
        return [...source].filter((char) => !this.hidden_characters.has(char)).join('');
    };


    /**
     * Метод для очистки скрытых данных из файла.
     * @param {string} source_path - Путь к файлу со скрытыми данными.
     * @returns {string} Очищенная строка.
     */
    public cleanFile (source_path: string): string {
        let source: string = '';
        try {
            source = fs.readFileSync(source_path, { encoding: 'utf-8' });
        } catch (error) {
            throw new Error('Unable to read the source file');
        }

        return this.cleanString(source);
    };
}

export { StegoUTF8, Position };