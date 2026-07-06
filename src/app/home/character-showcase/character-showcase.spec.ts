import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterShowcase, ShowcaseCharacter } from './character-showcase';

const characters: ShowcaseCharacter[] = [
  {
    id: 'lira',
    name: 'Lira',
    epithet: 'The Timeweaver',
    description: 'Bends time.',
    image: '/lira-wallpaper.png',
  },
  {
    id: 'ignara',
    name: 'Ignara',
    epithet: 'The Flameheart',
    description: 'Burns bright.',
    image: '/ignara-wallpaper.png',
  },
];

describe('CharacterShowcase', () => {
  let fixture: ComponentFixture<CharacterShowcase>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CharacterShowcase] });
    fixture = TestBed.createComponent(CharacterShowcase);
    fixture.componentRef.setInput('characters', characters);
    fixture.detectChanges();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function tabs(): HTMLButtonElement[] {
    return Array.from(el().querySelectorAll('[data-testid="character-tab"]'));
  }

  it('renders a selector tab and an artwork per character', () => {
    expect(tabs().length).toBe(2);
    const images = Array.from(el().querySelectorAll('img'));
    expect(images.map((img) => img.getAttribute('alt'))).toEqual([
      'Lira artwork',
      'Ignara artwork',
    ]);
  });

  it('shows the first character by default', () => {
    expect(el().querySelector('[data-testid="showcase-name"]')?.textContent).toContain('Lira');
    expect(tabs()[0].getAttribute('aria-pressed')).toBe('true');
    expect(tabs()[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('switches portrait, name and description when a tab is clicked', () => {
    tabs()[1].click();
    fixture.detectChanges();

    expect(el().querySelector('[data-testid="showcase-name"]')?.textContent).toContain('Ignara');
    expect(el().querySelector('[data-testid="showcase-description"]')?.textContent).toContain(
      'Burns bright.',
    );
    expect(tabs()[1].getAttribute('aria-pressed')).toBe('true');

    // The selected artwork is the only one visible to assistive tech.
    const images = Array.from(el().querySelectorAll('img'));
    expect(images[1].getAttribute('aria-hidden')).toBe('false');
    expect(images[0].getAttribute('aria-hidden')).toBe('true');
  });
});
