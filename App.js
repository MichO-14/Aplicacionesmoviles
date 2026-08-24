import { useState, useEffect, useRef} from "react";
//importamos para la animacion
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator, Keyboard, Animated } from "react-native";
import {Ionicons} from '@expo/vector-icons';
import {Audio} from 'expo-av';


export default function App() {
  //MEMORIAS DE PANTALLA (LO QUE VE EL USUARIO)
  //busqueda: guarda el texto que el usuario escribe 
  const[busqueda, setBusqueda] = useState('');
  //resultados: guarda la lista de canciones que nos manda internet
  const[resultados, setResultados] = useState([]);
  //cargando: es el interrupto (prendido/guardado) muestra la ruedita morada
  const[cargando, setCargando] = useState(false);

  //LAS MEMORIAS DEL REPRODUCTOR DE AUDIO
  //guarda la informacion de la cancion que se reproduce actualmente
  const[cancionActiva, setCancionActiva] = useState(null);
  //guarda el motor de audio que se comunica fisicamente con el altavoz del celular
  const[sonidoActual, setSonidoActual] = useState(null);
  //un interruptor para saber si la cancion esta reproduciendose o pausada
  const[estaReproduciendo, setEstaReproduciendo] = useState(false);

  //LA ANIMACION FLUIDA
  //usamos useRef en lugar de useState
  //Crea una memoria mmuy rapida que no traba la pantalla cuando cambia de numero
  const animacionEcualizador = useRef(new Animated.Value(0)).current;

  //este escucha al boton de play/pause y cambia el estado de la animacion
  useEffect(() => {

    //regla de oro: antes de animar, siempre regresamos las barras a 0 (al piso)
    animacionEcualizador.stopAnimation();
    animacionEcualizador.setValue(0);

    if(estaReproduciendo){
      //si la musica esta sonando hacemos que suba y baje de 1 a 0 repetidamente
      Animated.loop(
        Animated.sequence([
          //sube del 0 al 1 en medio segundo(300ms)
          Animated.timing(animacionEcualizador, {toValue: 1, duration: 300, useNativeDriver: false}),
          //baja del 1 al 0 en medio segundo(300ms)
          Animated.timing(animacionEcualizador, {toValue: 0, duration: 300, useNativeDriver: false}),
        ])
      ).start(); //que empiece a moverse la animacion!
    }
    //le decimos que se reinicie si el usuario cambia rapidamente de cancion. 
  },[estaReproduciendo, cancionActiva]);  
  //LA MAGIA: convertimos el 0 y 1 a tamaños reales(pixeles)
  //Barra 1: sube de 8 a 22 pixeles
  const altoBarra1 = animacionEcualizador.interpolate({inputRange: [0, 1], outputRange: [8,22]});
  //Barra 2: baja de 24 a 10 pixeles(lo hacemos asi para que parezca que bailan diferente)
  const altoBarra2 = animacionEcualizador.interpolate({inputRange: [0, 1], outputRange: [24,10]});
  //Barra 3: sube de 12 a 18 pixeles (un saltito mas corto)
  const altoBarra3 = animacionEcualizador.interpolate({inputRange: [0, 1], outputRange: [12,18]});

  //IR A INYTERNET Y BUSCAR CANCIONES (API DE APPLE MUSIC)
  const buscarMusica = async () => {
    //si la caja de texto esta vacia, no hacemos nada, nos salimos
    if(busqueda.trim() === '') return;
    Keyboard.dismiss(); //escondemos el teclado del celular
    setCargando(true); //encendemos ruedita de carga

  try{
    //Internet odia los espacios en blanco. Convertimos Tito doble p a Tito+doble+p
    const terminoLimpio = busqueda.replace(/ /g, '+');
    const url = `https://itunes.apple.com/search?term=${terminoLimpio}&entity=song&limit=20`;

    const respuesta = await fetch(url);
    const json = await respuesta.json(); //traducimos la respuesta
    setResultados(json.results); //guardamos la lista de canciones en memoria
  }catch(error){
    console.log(error);
  }finally{
    setCargando(false); //apagamos ruedita de carga
  }
};

//HACER QUE SUENE EL AUDIO
//este vigilante nos avisa exactamente en el momento que termina la cancion 
const monitorDeReproduccion = (estado) => {
  if(estado.didJustFinish){
    setEstaReproduciendo(false); //apagamos la barritas brillantes
    setCancionActiva(null); //escondemos el minireproductor de abajo
    }
};

const reproducirCancion = async (cancion) => {
  try {
    if(sonidoActual) {
      await sonidoActual.unloadAsync();
    }

    setCancionActiva(cancion);
    setEstaReproduciendo(true);
  
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true})

    const{ sound } = await Audio.Sound.createAsync(
      { uri: cancion.previewUrl },
      { shouldPlay: true},
      monitorDeReproduccion
    );

    setSonidoActual(sound);

  } catch (error) {
    console.log("Error el reproducir:", error);
  }
};

const alternarPlayPause = async () => {
  if(!sonidoActual) return;

  if(estaReproduciendo){
    await sonidoActual.pauseAsync();
    setEstaReproduciendo(false);
  } else{
    await sonidoActual.playAsync();
    setEstaReproduciendo(true);
  }
};

//LIPIEZA DE MEMORIA
useEffect(() =>{
  return sonidoActual ? () => {sonidoActual.unloadAsync();} : undefined;
}, [sonidoActual]);

//DIBUJAR LA PANTALLA
return ( 
  <View style={styles.contenedor}>
    {/*PARTE SUPERIOR TITULO Y BUSCADOR*/}

    <View style={styles.encabezado}>
      <Text style={styles.tituloHeader}>Explorar Musica</Text>
      <View style={styles.contenedorBusqueda}>
        <TextInput
        style={styles.input}
        placeholder="Buscar cancion o artista..."
        placeholderTextColor="#888"
        value={busqueda}
        onChangeText={setBusqueda}
        onSubmitEditing={buscarMusica}
      />
      <TouchableOpacity style={styles.botonBuscar} onPress={buscarMusica}>
        <Ionicons name="search" size={24} color=""/>
      </TouchableOpacity>
      </View>
    </View>
      {/*ZONA CENTRAL: LISTA DE CANCIONES*/}
        {cargando ?(
          <View style={styles.zonaCentrada}>
            <ActivityIndicator size="large" color="#A259FF" />
          </View>
        ) : (
          <FlatList
            data={resultados}
            keyExtractor={(item) => item.trackId.toString()}
            contentContainerStyle={{ paddingBottom: cancionActiva ? 90: 20}}
            renderItem={({item}) =>{
            const esLaActiva = cancionActiva?.trackId === item.trackId;
            return (
              <TouchableOpacity style={styles.tarjetaCancion} onPress={() => reproducirCancion(item)}>
                <Image source={{ uri: item.artworkUrl100}} style={styles.portada}/>

                <View style={styles.infoCancion}>
                  <Text style={[styles.tituloCancion, esLaActiva && { color: '#A259FF'}]}
                  numberOfLines={1}>
                    {item.trackName}
                  </Text>
                  <Text style={styles.artistaCancion} numberOfLines={1}>{item.artistName}</Text>
                </View>
                {/*DIBUJO DE LAS BARRITAS*/} 
                {esLaActiva && estaReproduciendo ? (
                    <View style={styles.contenedorEcualizador}>
                      <Animated.View style={[styles.barraEcualizador, {height: altoBarra1}]}/>
                      <Animated.View style={[styles.barraEcualizador, {height: altoBarra2}]}/>
                      <Animated.View style={[styles.barraEcualizador, {height: altoBarra3}]}/>
                    </View>
                ) : (
                  <Ionicons name="play-circle" size={32} color={esLaActiva ? "#A259FF" : "#444"}/>
                )}
              </TouchableOpacity>
            )
          }}
        />
      )}

      {/*PARTE INFERIOR DEL REPRODUCTOR FLOTANTE*/}
      {cancionActiva && (
        <View style={styles.miniReproductor}>
          <View style={styles.interiorMiniReproductor}>
            <Image source={{ uri: cancionActiva.artworkUrl100}} style={styles.portadaMini}/>
            <View style={styles.infoMini}>
              <Text style={styles.tituloMini} numberOfLines={1}>{cancionActiva.trackName}</Text>
              <Text style={styles.artistaMini} numberOfLines={1}>{cancionActiva.artistName}</Text>
            </View>

            {/*EL BOTON DE PLAY/PAUSA*/}
            <TouchableOpacity onPress={alternarPlayPause} style={styles.botonPlayPause}>
              <Ionicons
                name={estaReproduciendo ? "pause-circle" : "play-circle"}
                size={40}
                color="white"
              />
            </TouchableOpacity>

          </View>
        </View>
      )}

    </View>
  );
}

// ==========================================================
// 7. LOS ESTILOS (El diseño oscuro y minimalista)
// ==========================================================
const styles = StyleSheet.create({
  
  // Fondo base: Casi negro para que los colores resalten
  contenedor: { flex: 1, backgroundColor: '#0d0514', paddingTop: 50 },
  
  // Textos de arriba
  encabezado: { paddingHorizontal: 15, paddingBottom: 10 },
  tituloHeader: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 15 },
  contenedorBusqueda: { flexDirection: 'row', marginBottom: 10 },
  
  // La caja gris oscura donde escribe el usuario
  input: { flex: 1, backgroundColor: '#1a1025', color: '#ffffff', height: 50, borderRadius: 25, paddingHorizontal: 20, fontSize: 16 },
  
  // El botón morado redondo (#A259FF)
  botonBuscar: { backgroundColor: '#A259FF', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  
  // Para que la ruedita morada quede justo en medio de la pantalla
  zonaCentrada: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Diseño de cada bloque de canción en la lista
  tarjetaCancion: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15, marginBottom: 15, backgroundColor: '#1a1025', padding: 10, borderRadius: 10 },
  portada: { width: 50, height: 50, borderRadius: 5 },
  infoCancion: { flex: 1, marginLeft: 15, marginRight: 10, justifyContent: 'center' },
  tituloCancion: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  artistaCancion: { color: '#888', fontSize: 14 },

  // --- DISEÑO DEL ECUALIZADOR (Las barritas) ---
  contenedorEcualizador: {
    flexDirection: 'row',
    alignItems: 'flex-end', // El truco: Se alinean al piso, así crecen hacia arriba
    height: 24, 
    width: 24,
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  barraEcualizador: {
    width: 4,
    backgroundColor: '#A259FF', // Morado
    borderRadius: 2,
  },

  // --- DISEÑO DEL REPRODUCTOR FLOTANTE ---
  miniReproductor: {
    position: 'absolute', // El truco 2: Lo arranca del fondo y lo deja "volando"
    bottom: 20,           // A 20 pixeles del límite inferior del celular
    left: 10,
    right: 10,
    backgroundColor: '#A259FF', 
    borderRadius: 15,
    elevation: 10,        // Sombra en Android
    shadowColor: '#000',  // Sombra en iPhone
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  interiorMiniReproductor: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  portadaMini: { width: 40, height: 40, borderRadius: 8 },
  infoMini: { flex: 1, marginLeft: 12 },
  tituloMini: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  artistaMini: { color: '#e0c3ff', fontSize: 13 }, // Morado muy clarito para no competir con el título
  botonPlayPause: { paddingHorizontal: 5 },
});