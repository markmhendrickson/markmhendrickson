import unittest

from translation_chunks import _split_utf8, translate_with_byte_limit


class TranslationChunkTests(unittest.TestCase):
    def test_utf8_payloads_fit_mymemory_limit_without_dropping_text(self):
        source = ("An observation records a source. 关系 and résumé matter.\n\n" * 28).strip()

        class BoundedTranslator:
            def __init__(self):
                self.calls = []

            def translate(self, value):
                self.calls.append(value)
                if len(value.encode("utf-8")) > 500:
                    raise ValueError("MyMemory request exceeds 500 UTF-8 bytes")
                return value

        translator = BoundedTranslator()
        self.assertEqual(translate_with_byte_limit(source, translator, 500), source)
        self.assertGreater(len(translator.calls), 1)
        self.assertTrue(all(len(part.encode("utf-8")) <= 500 for part in translator.calls))

    def test_early_whitespace_never_sends_an_oversized_remainder(self):
        source = " " + "a" * 499 + "é"

        class BoundedTranslator:
            def __init__(self):
                self.calls = []

            def translate(self, value):
                self.calls.append(value)
                if len(value.encode("utf-8")) > 500:
                    raise ValueError("Provider request exceeds 500 UTF-8 bytes")
                return value

        translator = BoundedTranslator()
        self.assertEqual(translate_with_byte_limit(source, translator, 500), source)
        self.assertEqual("".join(_split_utf8(source, 500)), source)
        self.assertTrue(all(len(part.encode("utf-8")) <= 500 for part in translator.calls))
        self.assertGreaterEqual(len(translator.calls), 2)

    def test_multibyte_words_and_small_limits_preserve_every_character(self):
        for source, limit in [
            ("alpha beta\n\t中文 résumé  ", 8),
            ("é" * 251, 500),
            ("a b", 1),
            ("  a  b  ", 2),
        ]:
            with self.subTest(source=source, limit=limit):
                calls = []

                class IdentityTranslator:
                    def translate(self, value):
                        calls.append(value)
                        if len(value.encode("utf-8")) > limit:
                            raise ValueError("Provider request exceeds byte limit")
                        return value

                self.assertEqual(translate_with_byte_limit(source, IdentityTranslator(), limit), source)
                pieces = _split_utf8(source, limit)
                self.assertEqual("".join(pieces), source)
                self.assertTrue(all(len(piece.encode("utf-8")) <= limit for piece in pieces))
                self.assertTrue(all(len(call.encode("utf-8")) <= limit for call in calls))


if __name__ == "__main__":
    unittest.main()
