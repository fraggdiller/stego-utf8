# StegoUTF8 - Сокрытие данных в текстовых файлах с помощью Zero-Width Space
StegoUTF8 позволяет скрывать данные в текстовых файлах с использованием метода Zero-Width Space.

## Требования перед установкой

Убедитесь, что у вас установлена Node.js версии >=18.16.0. Вы можете проверить вашу текущую версию Node.js, выполнив:
```bash
node --version
```
Если у вас нет Node.js или у вас устаревшая версия, [загрузите и установите](https://nodejs.org/en/about/previous-releases) последнюю версию.

## Установка
Для установки пакета StegoUTF8, выполните следующую команду:

```bash
git clone https://github.com/fraggdiller/stego-utf8
```

```bash
cd stego-utf8
```

```bash
npm install
```

## Использование

*Примечание: StegoUTF8 не поддерживает кириллицу.*

##### Шифрование данных
```bash
npm start -- -E -f path/to/source.txt -o path/to/output.txt -t "Text to hide" -p 2
```
Эта команда скрывает данные "Text to hide" в файле path/to/source.txt с выбранной позицией 2 (NTHLINES) и сохраняет результат в path/to/output.txt.

##### Дешифрование данных
```bash
npm start -- -D -f path/to/encoded.txt -o path/to/decoded.txt
```
Эта команда извлекает скрытые данные из файла path/to/encoded.txt и сохраняет расшифрованный результат в path/to/decoded.txt.

##### Очистка данных
```bash
npm start -- -C -f path/to/source.txt -o path/to/cleaned.txt
```
Эта команда очищает скрытые данные из файла path/to/source.txt и сохраняет очищенный результат в path/to/cleaned.txt.

### Команды в командной строке
- -E или --encode: Опция для шифрования данных.
- -D или --decode: Опция для дешифрования данных.
- -C или --clean: Опция для очистки данных.
- -t или --to-hide: Строка, которую нужно скрыть.
- -f или --file-source: Путь к файлу для обработки.
- -o или --output-path: Путь для сохранения результата.
- -p или --position: Позиция для скрытия данных.
