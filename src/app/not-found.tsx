export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', background: '#f5efd7', color: '#123c1a', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(2.5rem, 8vw, 5rem)', letterSpacing: '-0.06em' }}>404</h1>
        <p style={{ marginTop: '0.75rem', fontSize: '1.1rem' }}>Cette page n’existe pas.</p>
      </div>
    </main>
  );
}
