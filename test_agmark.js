

const API_KEY = '579b464db66ec23bdd0000016fab3aeac91e45a458893854a84e1084';
const URL = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${API_KEY}&format=json&limit=5&filters[state]=Maharashtra`;

async function testFetch() {
  const rs = await fetch(URL);
  const data = await rs.json();
  console.log(JSON.stringify(data.records, null, 2));
}

testFetch().catch(console.error);
