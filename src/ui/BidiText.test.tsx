import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BidiText } from './BidiText';

describe('BidiText', () => {
  it('isolates mixed Arabic and Latin text with automatic direction', () => {
    const markup = renderToStaticMarkup(<BidiText>مسجد Example 123</BidiText>);

    expect(markup).toBe('<bdi dir="auto">مسجد Example 123</bdi>');
  });

  it('keeps provider identifiers isolated without forcing a page direction', () => {
    const markup = renderToStaticMarkup(<BidiText>Australia/Sydney</BidiText>);

    expect(markup).toBe('<bdi dir="auto">Australia/Sydney</bdi>');
  });
});
