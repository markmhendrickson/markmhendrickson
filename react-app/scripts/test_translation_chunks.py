import unittest

from translation_chunks import translate_with_byte_limit


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


if __name__ == "__main__":
    unittest.main()
