// URL API
const apiUrl = 'https://api-splp.layanan.go.id/jumlah_penduduk_kabkota/1.0/';
const geoJsonUrl = './assets/kab_aceh_jaya.geojson'; // Updated GeoJSON URL

// Fungsi untuk mengambil data dari API dan memfilter sesuai kriteria
async function fetchDataAndCreateChart() {
    try {
        // Ambil data dari API
        const response = await fetch(apiUrl);

        // Periksa apakah responsnya OK
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parsing data JSON
        const data = await response.json();

        // Filter data berdasarkan kriteria
        const filteredData = data.data.filter(item =>
            item.kabkot === "ACEH JAYA" &&
            item.prov === "ACEH" &&
            parseInt(item.tahun) >= 2019 &&
            parseInt(item.tahun) <= 2023
        );

        // Sort data by year and semester
        filteredData.sort((a, b) => {
            const yearA = parseInt(a.tahun);
            const yearB = parseInt(b.tahun);
            const semesterA = parseInt(a.semester);
            const semesterB = parseInt(b.semester);
            return yearA === yearB ? semesterA - semesterB : yearA - yearB;
        });

        // Extract data for the chart
        const labels = filteredData.map(item => `${item.tahun} - Semester ${item.semester}`);
        const malePopulation = filteredData.map(item => parseInt(item.laki_laki));
        const femalePopulation = filteredData.map(item => parseInt(item.perempuan));

        // Create chart
        const ctx = document.getElementById('populationChart').getContext('2d');
        const populationChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                        label: 'Laki-laki',
                        data: malePopulation,
                        borderColor: 'blue',
                        backgroundColor: 'rgba(0, 0, 255, 0.1)',
                        fill: true
                    },
                    {
                        label: 'Perempuan',
                        data: femalePopulation,
                        borderColor: 'red',
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Pertumbuhan Penduduk Aceh Jaya (2019-2023)'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Tahun - Semester'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Jumlah Penduduk'
                        }
                    }
                }
            }
        });
    } catch (error) {
        // Menangani kesalahan jika ada
        console.error('Terjadi kesalahan:', error);
    }
}

// Fungsi untuk menginisialisasi peta
function initMap() {
    const map = L.map('map').setView([4.7186, 95.6013], 10); // Koordinat awal Aceh Jaya
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Tambahkan GeoJSON untuk batas kabupaten dan kecamatan
    fetch(geoJsonUrl)
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                filter: feature => feature.properties.districts === "ACEH JAYA",
                style: {
                    color: 'red',
                    weight: 2
                }
            }).addTo(map);

            L.geoJSON(data, {
                filter: feature => feature.properties.sub_districts && feature.properties.districts === "ACEH JAYA",
                style: {
                    color: 'yellow',
                    weight: 1
                }
            }).addTo(map);
        })
        .catch(error => console.error('Error loading GeoJSON:', error));

    return map;
}

// Fungsi untuk zoom ke kecamatan
async function zoomToKecamatan() {
    const kecamatan = document.getElementById('kecamatanSelect').value;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=indonesia,aceh,aceh%20jaya,${kecamatan}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            map.setView([lat, lon], 13); // Zoom ke kecamatan yang dipilih
        } else {
            console.error('Tidak ada data untuk kecamatan ini.');
        }
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
    }
}

// Inisialisasi peta dan grafik setelah DOM siap
document.addEventListener('DOMContentLoaded', () => {
    window.map = initMap();
    fetchDataAndCreateChart();
});