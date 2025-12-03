import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Datos de ejemplo para la plantilla
const exampleData = [
  {
    'Nombre del Equipo': 'Águilas FC',
    'Categoría': '2016',
    'Nombre': 'Juan',
    'Apellido Paterno': 'García',
    'Apellido Materno': 'López',
    'Fecha Nacimiento (YYYY-MM-DD)': '2015-03-15',
    'CURP': 'GALJ150315HDFRPN01',
    'Nombre Tutor': 'María López',
    'Email Tutor': 'maria.lopez@example.com',
    'Teléfono Tutor': '5512345678',
    'Posición': 'Delantero',
    'Número Jersey': '10'
  },
  {
    'Nombre del Equipo': 'Águilas FC',
    'Categoría': '2016',
    'Nombre': 'Pedro',
    'Apellido Paterno': 'Martínez',
    'Apellido Materno': 'Sánchez',
    'Fecha Nacimiento (YYYY-MM-DD)': '2016-07-22',
    'CURP': 'MASP160722HDFRTR02',
    'Nombre Tutor': 'José Martínez',
    'Email Tutor': 'jose.martinez@example.com',
    'Teléfono Tutor': '5523456789',
    'Posición': 'Portero',
    'Número Jersey': '1'
  },
  {
    'Nombre del Equipo': 'Tigres FC',
    'Categoría': '2017',
    'Nombre': 'Luis',
    'Apellido Paterno': 'Hernández',
    'Apellido Materno': 'Ramírez',
    'Fecha Nacimiento (YYYY-MM-DD)': '2015-11-08',
    'CURP': 'HERL151108HDFRMS03',
    'Nombre Tutor': 'Ana Hernández',
    'Email Tutor': 'ana.hernandez@example.com',
    'Teléfono Tutor': '5534567890',
    'Posición': 'Defensa',
    'Número Jersey': '4'
  }
];

// Instrucciones para el usuario
const instructionsData = [
  {
    'INSTRUCCIONES': 'Complete los datos de cada jugador en las filas siguientes. Los ejemplos pueden ser eliminados.'
  },
  {
    'INSTRUCCIONES': 'Nombre del Equipo: Debe coincidir EXACTAMENTE con el nombre de uno de sus equipos registrados'
  },
  {
    'INSTRUCCIONES': 'Categoría: Debe coincidir con la categoría del equipo (ejemplo: 2016, 2017, Sub-11, etc.)'
  },
  {
    'INSTRUCCIONES': 'CURP: Debe tener exactamente 18 caracteres en mayúsculas'
  },
  {
    'INSTRUCCIONES': 'Fecha: Formato YYYY-MM-DD (ejemplo: 2015-03-15)'
  },
  {
    'INSTRUCCIONES': 'Teléfono: Mínimo 10 dígitos'
  },
  {
    'INSTRUCCIONES': 'Número Jersey: Entre 1 y 99'
  },
  {
    'INSTRUCCIONES': 'Posición: Campo opcional (Portero, Defensa, Medio, Delantero)'
  }
];

// Crear workbook
const wb = XLSX.utils.book_new();

// Crear hoja de instrucciones
const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones');

// Crear hoja de jugadores con ejemplos
const wsPlayers = XLSX.utils.json_to_sheet(exampleData);
XLSX.utils.book_append_sheet(wb, wsPlayers, 'Jugadores');

// Guardar archivo
const outputPath = path.join(process.cwd(), 'public', 'plantilla-jugadores.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Plantilla de jugadores generada en:', outputPath);
