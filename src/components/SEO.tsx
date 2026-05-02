import { Helmet } from "react-helmet-async";

const SITE_NAME = "GrãoHub";
const SITE_URL = "https://graoshub.com";
const DEFAULT_DESC =
  "Marketplace de fretes agrícolas e insumos do campo. Produtores encontram motoristas confiáveis. Motoristas encontram as melhores cargas. Grátis para começar.";
const DEFAULT_IMAGE = `${SITE_URL}/icons/icon-512.png`;

interface SEOProps {
  title?: string;
  description?: string;
  image?: string | null;
  path?: string;
  type?: "website" | "product";
}

export default function SEO({ title, description, image, path = "/", type = "website" }: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Fretes e Insumos Agrícolas`;
  const desc = description || DEFAULT_DESC;
  const img = (image && image.startsWith("http")) ? image : DEFAULT_IMAGE;
  const canonical = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <html lang="pt-BR" />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph — WhatsApp, Facebook, LinkedIn */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  );
}
