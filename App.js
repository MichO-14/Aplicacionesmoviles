import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const CIUDADES_PRUEBA = [
  { nombre: 'Local (GPS)', lat: null, lon: null },
  // Base McMurdo
  { nombre: 'Antártida', lat: -77.8463, lon: 166.6682 },
  // EE.UU: El lugar más caluroso del mundo. 
  { nombre: 'Valle de la Muerte', lat: 36.4500, lon: -116.8721 },
  // India: El lugar más lluvioso del planeta (Monzones). 
  { nombre: 'Cherrapunji', lat: 25.2702, lon: 91.7323 },
  // Venezuela: Capital mundial de los relámpagos. 
  { nombre: 'Maracaibo', lat: 9.7457, lon: -71.5587 },
  // China: El mágico "Mar de Nubes".
  { nombre: 'Huangshan', lat: 30.1265, lon: 118.1733 }, 
  // Tórshavn: Uno de los lugares más nublados y oscuros del mundo.
  { nombre: 'Islas Feroe', lat: 62.0014, lon: -6.7662 }, 
  // Nepal: Altitud extrema. 
  { nombre: 'Everest', lat: 27.9881, lon: 86.9250 },
  // Calidad de Aire Peligrosa 
  { nombre: 'Nueva Delhi', lat: 28.6139, lon: 77.2090 },
  // Calidad de Aire Excelente
  { nombre: 'Reikiavik', lat: 64.1466, lon: -21.9426 },
];

export default function App() {
  const [ciudad, setCiudad] = useState('Buscando...');
  const [clima, setClima] = useState(null);
  const [calidadAire, setCalidadAire] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // 1. DICCIONARIOS DE TRADUCCIÓN VISUAL (Fondos dinámicos)
  const obtenerInfoClima = (codigo) => {
    if (codigo === 0) return { texto: 'Despejado', icono: 'sunny', color: '#FFD700', fondo: '#2B7ACE' }; // Azul cielo
    if (codigo >= 1 && codigo <= 3) return { texto: 'Nublado', icono: 'cloud', color: '#FFFFFF', fondo: '#546E7A' }; // Gris azulado
    if (codigo >= 45 && codigo <= 48) return { texto: 'Niebla', icono: 'cloud-offline', color: '#D3D3D3', fondo: '#78909C' }; // Gris claro
    if (codigo >= 51 && codigo <= 67) return { texto: 'Lluvia', icono: 'rainy', color: '#87CEFA', fondo: '#37474F' }; // Gris oscuro tormenta
    if (codigo >= 71 && codigo <= 77) return { texto: 'Nieve', icono: 'snow', color: '#FFFFFF', fondo: '#81D4FA' }; // Azul hielo
    if (codigo >= 95) return { texto: 'Tormenta', icono: 'thunderstorm', color: '#FFA500', fondo: '#263238' }; // Casi negro
    return { texto: 'Desconocido', icono: 'help-circle', color: '#FFFFFF', fondo: '#0B101E' };
  };

  const obtenerInfoAire = (aqi) => {
    if (aqi <= 20) return { texto: 'Excelente', color: '#00E676' };
    if (aqi <= 40) return { texto: 'Buena', color: '#98FB98' };
    if (aqi <= 60) return { texto: 'Moderada', color: '#FFCA28' };
    if (aqi <= 80) return { texto: 'Mala', color: '#FF7043' };
    return { texto: 'Peligrosa', color: '#D32F2F' };
  };

  // 2. LÓGICA DE EXTRACCIÓN (Promesas en paralelo)
  const obtenerDatos = async (latPrueba = null, lonPrueba = null, nombrePrueba = null) => {
    setCargando(true);
    setError(null);

    try {
      let lat = latPrueba;
      let lon = lonPrueba;

      // Si no pasamos coordenadas de prueba, usamos el GPS real
      if (!lat || !lon) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permiso de ubicación denegado.');
          setCargando(false);
          return;
        }

        const ubicacion = await Location.getCurrentPositionAsync({});
        lat = ubicacion.coords.latitude;
        lon = ubicacion.coords.longitude;
        
        const direccion = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        setCiudad(direccion.length > 0 ? (direccion[0].city || direccion[0].region) : 'Tu Ubicación');
      } else {
        setCiudad(nombrePrueba);
      }

      // Preparamos las dos URLs (Clima General y Calidad del Aire)
      const urlClima = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
      const urlAire = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi`;
      
      // EL TRUCO: Promise.all ejecuta ambas peticiones al mismo tiempo
      const [resClima, resAire] = await Promise.all([
        fetch(urlClima),
        fetch(urlAire)
      ]);

      const jsonClima = await resClima.json();
      const jsonAire = await resAire.json();
      
      setClima({
        actual: jsonClima.current,
        diario: jsonClima.daily
      });
      setCalidadAire(jsonAire.current.european_aqi);

    } catch (err) {
      setError('Error al conectar con los satélites.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { obtenerDatos(); }, []);

  // 3. PANTALLAS DE ESPERA
  if (cargando) {
    return (
      <View style={[styles.contenedor, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.textoGeneral}>Sincronizando datos...</Text>
      </View>
    );
  }

  if (error) return (
    <View style={[styles.contenedor, { justifyContent: 'center' }]}><Text style={styles.textoGeneral}>{error}</Text></View>
  );

  // 4. RENDERIZADO VISUAL
  const infoVisual = obtenerInfoClima(clima?.actual?.weather_code);
  const infoAire = obtenerInfoAire(calidadAire);

  return (
    // Inyectamos el color de fondo dinámico directamente al contenedor padre
    <View style={[styles.contenedor, { backgroundColor: infoVisual.fondo }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.cabecera}>
          <Ionicons name="location-sharp" size={24} color="white" />
          <Text style={styles.textoCiudad}>{ciudad}</Text>
        </View>

        {/* --- BLOQUE CENTRAL (Diseño centrado con píldora) --- */}
        <View style={styles.seccionPrincipal}>
          <Ionicons name={infoVisual.icono} size={140} color={infoVisual.color} />
          <Text style={styles.textoTemperatura}>{Math.round(clima?.actual?.temperature_2m)}°</Text>
          <Text style={styles.textoDescripcion}>{infoVisual.texto}</Text>

          {/* Detalles simplificados: Sensación, Max y Min en una cápsula oscura */}
          <View style={styles.filaTemperaturas}>
            <Text style={styles.textoSensacion}>Sensación: {Math.round(clima?.actual?.apparent_temperature)}°</Text>
            <View style={styles.divisor} />
            <Ionicons name="arrow-up" size={16} color="white" />
            <Text style={styles.textoMinMax}>{Math.round(clima?.diario?.temperature_2m_max[0])}°</Text>
            <View style={styles.divisor} />
            <Ionicons name="arrow-down" size={16} color="white" />
            <Text style={styles.textoMinMax}>{Math.round(clima?.diario?.temperature_2m_min[0])}°</Text>
          </View>
        </View>

        {/* --- TARJETAS INFERIORES (2 Cuadradas, 1 Rectangular) --- */}
        <View style={styles.gridTarjetas}>
          <View style={styles.tarjetaCuadrada}>
            <Ionicons name="water-outline" size={32} color="#87CEFA" />
            <Text style={styles.valorDetalle}>{clima?.actual?.relative_humidity_2m}%</Text>
            <Text style={styles.etiquetaDetalle}>Humedad</Text>
          </View>

          <View style={styles.tarjetaCuadrada}>
            <Ionicons name="leaf-outline" size={32} color="#98FB98" />
            <Text style={styles.valorDetalle}>{clima?.actual?.wind_speed_10m}</Text>
            <Text style={styles.etiquetaDetalle}>km/h Viento</Text>
          </View>
        </View>

        <View style={styles.tarjetaRectangular}>
          <View>
            <Text style={styles.etiquetaDetalle}>Calidad del Aire (AQI)</Text>
            <Text style={[styles.valorDetalle, { color: infoAire.color }]}>{infoAire.texto}</Text>
          </View>
          <Ionicons name="speedometer-outline" size={40} color={infoAire.color} />
        </View>

        {/* --- MODO PRUEBAS (Botones para simular otros países) --- */}
        <Text style={styles.tituloPruebas}>Laboratorio de Pruebas:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollPruebas}>
          {CIUDADES_PRUEBA.map((c, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.botonPrueba} 
              onPress={() => obtenerDatos(c.lat, c.lon, c.nombre)}>
              <Text style={styles.textoBotonPrueba}>{c.nombre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

      </ScrollView>
    </View>
  );
}


// 5. ESTILOS (Glassmorphism dinámico y UI centrada)
const styles = StyleSheet.create({
  contenedor: { flex: 1 }, 
  scroll: { flexGrow: 1, paddingTop: 60, alignItems: 'center', paddingBottom: 40 },
  textoGeneral: { color: 'white', marginTop: 15 },
  
  cabecera: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  textoCiudad: { color: 'white', fontSize: 28, fontWeight: '600', marginLeft: 8 },

  seccionPrincipal: { alignItems: 'center', marginBottom: 40 },
  textoTemperatura: { color: 'white', fontSize: 130, fontWeight: '200', marginTop: -20, marginBottom: -15 },
  textoDescripcion: { color: 'white', fontSize: 26, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 15 },
  
  // La "Cápsula" oscura para las temperaturas secundarias
  filaTemperaturas: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  textoSensacion: { color: 'white', fontSize: 16, fontWeight: '500', marginRight: 5 },
  textoMinMax: { color: 'white', fontSize: 16, fontWeight: '600', marginHorizontal: 5 },
  divisor: { height: 15, width: 1, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 8 },

  gridTarjetas: { flexDirection: 'row', justifyContent: 'space-between', width: '90%', marginBottom: 15 },
  tarjetaCuadrada: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 20, borderRadius: 25, width: '48%', alignItems: 'center', borderTopWidth: 1, borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  
  tarjetaRectangular: { backgroundColor: 'rgba(255,255,255,0.15)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '90%', padding: 20, borderRadius: 25, borderTopWidth: 1, borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginBottom: 40 },
  
  valorDetalle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginTop: 5 },
  etiquetaDetalle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' },

  tituloPruebas: { color: 'rgba(255,255,255,0.5)', alignSelf: 'flex-start', marginLeft: 20, marginBottom: 10, fontSize: 12, textTransform: 'uppercase' },
  scrollPruebas: { width: '100%', paddingHorizontal: 15 },
  botonPrueba: { backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 15, marginRight: 10, height: 40 },
  textoBotonPrueba: { color: 'white', fontSize: 14, fontWeight: '500' }
});