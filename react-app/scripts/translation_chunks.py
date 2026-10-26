"""Keep fallback translator requests within a provider's UTF-8 byte limit."""


def _split_utf8(text: str, max_bytes: int) -> list[str]:
    if max_bytes < 1:
        raise ValueError("max_bytes must be positive")
    pieces: list[str] = []
    current = ""
    for char in text:
        if len(char.encode("utf-8")) > max_bytes:
            raise ValueError("A character exceeds the provider byte limit")
        if current and len((current + char).encode("utf-8")) > max_bytes:
            boundary = max((i + 1 for i, c in enumerate(current) if c.isspace()), default=0)
            if boundary:
                pieces.append(current[:boundary])
                current = current[boundary:]
                if current and len((current + char).encode("utf-8")) > max_bytes:
                    pieces.append(current)
                    current = ""
                current += char
            else:
                pieces.append(current)
                current = char
        else:
            current += char
    if current:
        pieces.append(current)
    return pieces


def translate_with_byte_limit(text: str, translator, max_bytes: int) -> str:
    """Translate bounded requests while retaining whitespace at chunk boundaries."""
    translated: list[str] = []
    for piece in _split_utf8(text, max_bytes):
        content = piece.rstrip()
        suffix = piece[len(content):]
        if not content:
            translated.append(piece)
            continue
        candidate = translator.translate(content)
        if candidate is None:
            raise RuntimeError("Translator returned no content")
        translated.append(str(candidate).rstrip() + suffix)
    return "".join(translated)
