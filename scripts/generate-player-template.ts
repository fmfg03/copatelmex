import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

const exampleData = [
  { teamName: 'Águilas FC', category: '2016', firstName: 'Juan', paternalSurname: 'García', maternalSurname: 'López', birthDate: '2015-03-15', curp: 'GALJ150315HDFRPN01', parentName: 'María López', emailTutor: 'maria.lopez@example.com', phoneTutor: '5512345678', position: 'Delantero', jersey: '10' },
  { teamName: 'Águilas FC', category: '2016', firstName: 'Pedro', paternalSurname: 'Martínez', maternalSurname: 'Sánchez', birthDate: '2016-07-22', curp: 'MASP160722HDFRTR02', parentName: 'José Martínez', emailTutor: 'jose.martinez@example.com', phoneTutor: '5523456789', position: 'Portero', jersey: '1' },
  { teamName: 'Tigres FC', category: '2017', firstName: 'Luis', paternalSurname: 'Hernández', maternalSurname: 'Ramírez', birthDate: '2015-11-08', curp: 'HERL151108HDFRMS03', parentName: 'Ana Hernández', emailTutor: 'ana.hernandez@example.com', phoneTutor: '5534567890', position: 'Defensa', jersey: '4' },
];

const instructions = [
  'Complete los datos de cada jugador en las filas siguientes. Los ejemplos pueden ser eliminados.',
  'Nombre del Equipo: Debe coincidir EXACTAMENTE con el nombre de uno de sus equipos registrados',
  'Categoría: Debe coincidir con la categoría del equipo (ejemplo: 2016, 2017, Sub-11, etc.)',
  'CURP: Debe tener exactamente 18 caracteres en mayúsculas',
  'Fecha: Formato YYYY-MM-DD (ejemplo: 2015-03-15)',
  'Teléfono: Mínimo 10 dígitos',
  'Número Jersey: Entre 1 y 99',
  'Posición: Campo opcional (Portero, Defensa, Medio, Delantero)',
];

async function main() {
  const wb = new ExcelJS.Workbook();

  const instrSheet = wb.addWorksheet('Instrucciones');
  instrSheet.getColumn(1).width = 80;
  instructions.forEach(text => instrSheet.addRow([text]));

  const playersSheet = wb.addWorksheet('Jugadores');
  playersSheet.columns = [
    { header: 'Nombre del Equipo', key: 'teamName', width: 25 },
    { header: 'Categoría', key: 'category', width: 15 },
    { header: 'Nombre', key: 'firstName', width: 15 },
    { header: 'Apellido Paterno', key: 'paternalSurname', width: 18 },
    { header: 'Apellido Materno', key: 'maternalSurname', width: 18 },
    { header: 'Fecha Nacimiento (YYYY-MM-DD)', key: 'birthDate', width: 28 },
    { header: 'CURP', key: 'curp', width: 20 },
    { header: 'Nombre Tutor', key: 'parentName', width: 20 },
    { header: 'Email Tutor', key: 'emailTutor', width: 28 },
    { header: 'Teléfono Tutor', key: 'phoneTutor', width: 18 },
    { header: 'Posición', key: 'position', width: 15 },
    { header: 'Número Jersey', key: 'jersey', width: 15 },
  ];
  playersSheet.addRows(exampleData);

  const outputPath = path.join(process.cwd(), 'public', 'plantilla-jugadores.xlsx');
  await wb.xlsx.writeFile(outputPath);
  console.log('✅ Plantilla de jugadores generada en:', outputPath);
}

main();
