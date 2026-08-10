import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert } from 'react-native';

export default function App() {
  // 1. ESTADO DE NAVEGACIÓN: Controla qué pantalla está viendo el usuario
  const [pantallaActual, setPantallaActual] = useState('registro');

  // 2. ESTADOS DEL FORMULARIO: Memoria para cada campo de texto
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');

  // 3. FUNCIÓN DE VALIDACIÓN Y REGISTRO
  const validarYRegistrar = () => {
    // A) Validar campos vacíos
    if (!nombre.trim() || !correo.trim() || !telefono.trim() || !password.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    // B) Validar que el teléfono tenga EXACTAMENTE 10 dígitos
    // Como maxLength={10} ya evita que sean más, aquí evitamos que sean menos.
    if (telefono.length !== 10) {
      Alert.alert('Error', 'El número de teléfono debe tener exactamente 10 dígitos.');
      return;
    }

    // C) Validar formato de correo (debe tener un @ y un punto)
    if (!correo.includes('@') || !correo.includes('.')) {
      Alert.alert('Error', 'Ingresa un correo electrónico válido.');
      return;
    }

    // D) Validar longitud de contraseña
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Si pasa todas las pruebas, lanzamos la alerta de Éxito
    Alert.alert(
      '¡Registro Exitoso!',
      `Hola ${nombre}, tu cuenta ha sido creada.`,
      [
        {
          text: 'Continuar',
          // Al presionar el botón de la alerta, cambiamos de pantalla
          onPress: () => setPantallaActual('bienvenida') 
        }
      ]
    );
  };

  // 4. FUNCIÓN PARA REINICIAR LA APP
  const iniciarNuevoRegistro = () => {
    setNombre('');
    setCorreo('');
    setTelefono('');
    setPassword('');
    setPantallaActual('registro'); // Nos regresa a la pantalla inicial
  };

  // ==========================================================
  // PANTALLA 2: BIENVENIDA (Se muestra si el estado cambia)
  // ==========================================================
  if (pantallaActual === 'bienvenida') {
    return (
      <View style={styles.contenedorCentrado}>
        <Text style={styles.tituloPrincipal}>¡Bienvenido, {nombre}!</Text>
        <Text style={styles.subtitulo}>Tu registro se completó correctamente.</Text>
        
        <View style={styles.botonEspaciado}>
          <Button title="Nuevo Registro" onPress={iniciarNuevoRegistro} color="#28a745" />
        </View>
      </View>
    );
  }

  // ==========================================================
  // PANTALLA 1: FORMULARIO DE REGISTRO (Pantalla por defecto)
  // ==========================================================
  return (
    <View style={styles.contenedor}>
      <Text style={styles.tituloPrincipal}>Crear Cuenta</Text>

      {/* Campo: Nombre */}
      <Text style={styles.etiqueta}>Nombre completo:</Text>
      <TextInput 
        style={styles.input}
        placeholder="Ej. Juan Pérez"
        value={nombre}
        onChangeText={setNombre}
      />

      {/* Campo: Teléfono (Abre el teclado numérico del celular) */}
      <Text style={styles.etiqueta}>Teléfono celular:</Text>
      <TextInput 
        style={styles.input}
        placeholder="10 dígitos"
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
        maxLength={10} 
      />

      {/* Campo: Correo (Abre el teclado optimizado para emails) */}
      <Text style={styles.etiqueta}>Correo electrónico:</Text>
      <TextInput 
        style={styles.input}
        placeholder="usuario@ejemplo.com"
        value={correo}
        onChangeText={setCorreo}
        keyboardType="email-address"
        autoCapitalize="none" // Evita que la primera letra sea mayúscula
      />

      {/* Campo: Contraseña (Oculta los caracteres) */}
      <Text style={styles.etiqueta}>Contraseña:</Text>
      <TextInput 
        style={styles.input}
        placeholder="Mínimo 6 caracteres"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true} // Cambia las letras por puntitos
      />

      {/* Botón de envío */}
      <View style={styles.botonEspaciado}>
        <Button title="Registrarme" onPress={validarYRegistrar} color="#005691" />
      </View>
    </View>
  );
}

// 5. ESTILOS BONITOS Y LIMPIOS
const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#f4f7f6', // Un fondo ligeramente gris/azulado para darle toque moderno
    paddingTop: 70,
    paddingHorizontal: 25,
  },
  contenedorCentrado: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  tituloPrincipal: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 30,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  etiqueta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444444',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 15,
    fontSize: 16,
  },
  botonEspaciado: {
    marginTop: 15,
  }
});