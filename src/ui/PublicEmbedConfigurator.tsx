import {
  buildPublicEmbedPath,
  buildPublicEmbedSnippet,
  publicEmbedDirection,
  type PublicEmbedConfig,
} from '../domain/publicEmbed';

import './public-embed-configurator.css';

interface PublicEmbedConfiguratorProps {
  readonly origin: string;
  readonly config: PublicEmbedConfig;
  readonly mosqueName: string;
}

const LABELS = {
  en: {
    heading: 'Website embed',
    description: 'Copy this embed code into your mosque website.',
    preview: 'Preview',
    code: 'Embed code',
  },
  ar: {
    heading: 'تضمين الموقع',
    description: 'انسخ رمز التضمين هذا إلى موقع المسجد.',
    preview: 'معاينة',
    code: 'رمز التضمين',
  },
} as const;

export function PublicEmbedConfigurator({
  origin,
  config,
  mosqueName,
}: PublicEmbedConfiguratorProps) {
  const labels = LABELS[config.locale];
  const direction = publicEmbedDirection(config.locale);
  const title = `${mosqueName} ${config.kind}`;
  const snippet = buildPublicEmbedSnippet(origin, config, title);
  const previewPath = buildPublicEmbedPath(config);

  return (
    <section
      className="public-embed-configurator"
      data-theme={config.theme}
      dir={direction}
      lang={config.locale}
    >
      <header>
        <p className="public-embed-configurator__eyebrow">SalahOS</p>
        <h2>{labels.heading}</h2>
        <p>{labels.description}</p>
      </header>

      <div className="public-embed-configurator__grid">
        <article className="public-embed-configurator__preview">
          <span>{labels.preview}</span>
          <strong>{mosqueName}</strong>
          <code>{previewPath}</code>
        </article>

        <label className="public-embed-configurator__code">
          <span>{labels.code}</span>
          <textarea readOnly rows={7} value={snippet} />
        </label>
      </div>
    </section>
  );
}
