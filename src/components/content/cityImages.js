// Async function to fetch a city image from Unsplash
export async function getCityImage(city) {
  const accessKey = 'YOUR_UNSPLASH_ACCESS_KEY'; // <-- Replace with your Unsplash Access Key
  const endpoint = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(city)}&client_id=${accessKey}&orientation=landscape&per_page=1`;

  // try {
  //   const res = await fetch(endpoint);
  //   if (!res.ok) throw new Error('Unsplash error');
  //   const data = await res.json();
  //   if (data.results && data.results.length > 0) {
  //     return data.results[0].urls.regular;
  //   }
  // } catch (e) {
  //   // Fallback below
  // }
  // Fallback placeholder
  return 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=600&q=80';
}
