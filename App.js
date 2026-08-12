
import { useState, useEffect } from 'react';
import { StyleSheet, 
  Text, 
  View, 
  TextInput, 
  Button, 
  Alert,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator } from 'react-native';

export default function App() {
  //Estados de la aplicacion
  //'usuarios'guardara los datos descargados de internet, empieza vacio
  const [usuarios, setUsuarios] = useState([]);
  //'cargando' controla si mostramos la ruedita de espera o la lista. empieza en true (booleano)
  const [cargando, setCargando] = useState(true);

  //efecto de arranque (useeffect)
  //le dice a la app "ejecuta esta funcion justo despues que la pantalla se muestre por primera vez
  //los controles vacios [] al final indican que se ejecuta una sola vez despues de que abre la app
  useEffect(() => {
    descargarUsuarios();
  }, []);

  //*LA FUNCION QUE SE CONECTA A INTERNET (Async/Await)
  const descargarUsuarios = async () => {
    try {
      //Hacemos la posicion a la base de datos publica (pedimos 10 usuarios)
      const respuesta = await fetch('https://randomuser.me/api/?results=10');
      //Convertimos la respuesta en un objeto JSON
      const json = await respuesta.json();
      //Guardamos la lista de usuarios en la memoria de la app
      setUsuarios(json.results);
      //apagamos la ruedita de carga
      setCargando(false);
    } catch (error) {
      console.error("Hubo un problema descargando los datos", error);
      setCargando(false);
    }
  };
//PANTALLA DE CARGA (Renderizado condicional)
if (cargando) {
  return (
    <View style={styles.Centrada}>
      <ActivityIndicator size="large" color="#ff00d4" />
      <Text style={styles.textoCarga}>Descargando perfiles...</Text>
    </View>
  );
}

//PANTALLA PRINCIPAL (La lista con datos)
return (
  <View style={styles.contenedor}>
    <Text style={styles.tituloPrincipal}>Directorio Global</Text>

      <FlatList
      data={usuarios}
      //la API de random usa un email unico, nos sirve como ID
      keyExtractor={(item) => item.email}
      renderItem={({ item }) => (
        <View style={styles.tarjetaUsuario}>
          {/*nuevo componente Image para imagenes de internet se usa la propiedad url*/}
          <Image
            source={{ uri: item.picture.large }}
            style={styles.imagenPerfil}
          />

          <View style={styles.infoUsuario}>
            <Text style={styles.nombreUsuario}>
              {item.name.first} {item.name.last}
            </Text>
            <Text style={styles.correoUsuario}>{item.email}</Text>
            <Text style={styles.paisUsuario}>{item.location.country}</Text>
          </View>
        </View>
      )}
      />
  </View>
);
}

//ESTILOS VISUALES
const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#fcd8f8',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  pantallaCentrada: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fcd8f8',
  },
  textoCarga: {
    marginTop: 15,
    fontSize: 18,
    color: '#180024',
  },
  tituloPrincipal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2a0015',
    marginBottom: 20,
    textAlign: 'center',  
  },
  tarjetaUsuario: {
    flexDirection: 'row',
    backgroundColor: '#ea75ff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#600083',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  imagenPerfil: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  infoUsuario: {
    flex: 1,
    justifyContent: 'center',
  },
  nombreUsuario: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  correoUsuario: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 5,
  },
  paisUsuario: {
    fontSize: 14,
    color: '#ffffff',
  },
}); 