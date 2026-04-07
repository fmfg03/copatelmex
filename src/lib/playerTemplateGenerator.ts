import ExcelJS from 'exceljs';

export const generatePlayerTemplate = async () => {
  const workbook = new ExcelJS.Workbook();

  // Instrucciones sheet
  const instrSheet = workbook.addWorksheet('Instrucciones');
  instrSheet.getColumn(1).width = 80;
  const instructions = [
    '1. Complete los datos de cada jugador en las filas siguientes',
    '2. Los ejemplos pueden ser eliminados',
    '3. Nombre del Equipo: Debe coincidir EXACTAMENTE con el nombre de uno de sus equipos registrados',
    '4. Categoría: Debe coincidir con la categoría del equipo',
    '5. CURP: OBLIGATORIO - Debe tener exactamente 18 caracteres en MAYÚSCULAS',
    '6. Fecha: Formato YYYY-MM-DD (ejemplo: 2015-03-15)',
    '7. Teléfono: Mínimo 10 dígitos',
    '8. Número Jersey: Entre 1 y 99',
    '9. Posición: Campo opcional (Portero, Defensa, Medio, Delantero)',
    '',
    'IMPORTANTE: Mantenga los nombres de las columnas exactamente como están'
  ];
  instructions.forEach(text => instrSheet.addRow([text]));

  // Players sheet
  const playersSheet = workbook.addWorksheet('Jugadores');
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

  playersSheet.addRows([
    { teamName: 'Águilas FC', category: '2016', firstName: 'Juan', paternalSurname: 'García', maternalSurname: 'López', birthDate: '2015-03-15', curp: 'GALJ150315HDFRPN01', parentName: 'María López', emailTutor: 'maria.lopez@example.com', phoneTutor: '5512345678', position: 'Delantero', jersey: '10' },
    { teamName: 'Águilas FC', category: '2016', firstName: 'Pedro', paternalSurname: 'Martínez', maternalSurname: 'Sánchez', birthDate: '2016-07-22', curp: 'MASP160722HDFRTR02', parentName: 'José Martínez', emailTutor: 'jose.martinez@example.com', phoneTutor: '5523456789', position: 'Portero', jersey: '1' },
    { teamName: 'Tigres FC', category: '2017', firstName: 'Luis', paternalSurname: 'Hernández', maternalSurname: 'Ramírez', birthDate: '2015-11-08', curp: 'HERL151108HDFRMS03', parentName: 'Ana Hernández', emailTutor: 'ana.hernandez@example.com', phoneTutor: '5534567890', position: 'Defensa', jersey: '4' },
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plantilla-carga-jugadores.xlsx';
  link.click();
  window.URL.revokeObjectURL(url);
};

interface ValidationError {
  row: number;
  column: string;
  error: string;
  value?: string;
}

interface ParseResult {
  players: any[];
  errors: ValidationError[];
  warnings: ValidationError[];
}

const validatePlayerData = (row: any, rowIndex: number, teams: any[], categories: any[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  const actualRow = rowIndex + 2;

  const teamName = row['Nombre del Equipo']?.toString().trim();
  if (!teamName) {
    errors.push({ row: actualRow, column: 'Nombre del Equipo', error: 'Campo requerido' });
  } else {
    const team = teams.find(t => t.teamName.toLowerCase() === teamName.toLowerCase());
    if (!team) {
      errors.push({ row: actualRow, column: 'Nombre del Equipo', error: 'El equipo no existe en sus equipos registrados', value: teamName });
    }
  }

  const categoryName = row['Categoría']?.toString().trim();
  if (!categoryName) {
    errors.push({ row: actualRow, column: 'Categoría', error: 'Campo requerido' });
  } else {
    const category = categories.find(c => c.name === categoryName);
    if (!category) {
      errors.push({ row: actualRow, column: 'Categoría', error: 'Categoría no válida', value: categoryName });
    }
  }

  if (!row['Nombre']?.toString().trim()) {
    errors.push({ row: actualRow, column: 'Nombre', error: 'Campo requerido' });
  } else if (row['Nombre'].toString().length > 100) {
    errors.push({ row: actualRow, column: 'Nombre', error: 'Máximo 100 caracteres', value: row['Nombre'] });
  }

  if (!row['Apellido Paterno']?.toString().trim()) {
    errors.push({ row: actualRow, column: 'Apellido Paterno', error: 'Campo requerido' });
  } else if (row['Apellido Paterno'].toString().length > 100) {
    errors.push({ row: actualRow, column: 'Apellido Paterno', error: 'Máximo 100 caracteres' });
  }

  if (!row['Apellido Materno']?.toString().trim()) {
    errors.push({ row: actualRow, column: 'Apellido Materno', error: 'Campo requerido' });
  } else if (row['Apellido Materno'].toString().length > 100) {
    errors.push({ row: actualRow, column: 'Apellido Materno', error: 'Máximo 100 caracteres' });
  }

  const birthDate = row['Fecha Nacimiento (YYYY-MM-DD)']?.toString().trim();
  if (!birthDate) {
    errors.push({ row: actualRow, column: 'Fecha Nacimiento', error: 'Campo requerido' });
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthDate)) {
      errors.push({ row: actualRow, column: 'Fecha Nacimiento', error: 'Formato inválido. Use YYYY-MM-DD', value: birthDate });
    } else {
      const date = new Date(birthDate);
      if (isNaN(date.getTime())) {
        errors.push({ row: actualRow, column: 'Fecha Nacimiento', error: 'Fecha inválida', value: birthDate });
      }
    }
  }

  const curp = row['CURP']?.toString().trim().toUpperCase();
  if (!curp) {
    errors.push({ row: actualRow, column: 'CURP', error: 'Campo requerido' });
  } else if (curp.length !== 18) {
    errors.push({ row: actualRow, column: 'CURP', error: 'Debe tener exactamente 18 caracteres', value: curp });
  } else {
    const curpRegex = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/;
    if (!curpRegex.test(curp)) {
      errors.push({ row: actualRow, column: 'CURP', error: 'Formato inválido', value: curp });
    }
  }

  if (!row['Nombre Tutor']?.toString().trim()) {
    errors.push({ row: actualRow, column: 'Nombre Tutor', error: 'Campo requerido' });
  } else if (row['Nombre Tutor'].toString().length > 100) {
    errors.push({ row: actualRow, column: 'Nombre Tutor', error: 'Máximo 100 caracteres' });
  }

  const email = row['Email Tutor']?.toString().trim();
  if (!email) {
    errors.push({ row: actualRow, column: 'Email Tutor', error: 'Campo requerido' });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({ row: actualRow, column: 'Email Tutor', error: 'Email inválido', value: email });
    } else if (email.length > 255) {
      errors.push({ row: actualRow, column: 'Email Tutor', error: 'Máximo 255 caracteres' });
    }
  }

  const phone = row['Teléfono Tutor']?.toString().trim();
  if (!phone) {
    errors.push({ row: actualRow, column: 'Teléfono Tutor', error: 'Campo requerido' });
  } else if (phone.length < 10) {
    errors.push({ row: actualRow, column: 'Teléfono Tutor', error: 'Mínimo 10 dígitos', value: phone });
  } else if (phone.length > 20) {
    errors.push({ row: actualRow, column: 'Teléfono Tutor', error: 'Máximo 20 caracteres' });
  }

  const position = row['Posición']?.toString().trim();
  if (position && position.length > 50) {
    errors.push({ row: actualRow, column: 'Posición', error: 'Máximo 50 caracteres' });
  }

  const jersey = row['Número Jersey']?.toString().trim();
  if (!jersey) {
    errors.push({ row: actualRow, column: 'Número Jersey', error: 'Campo requerido' });
  } else {
    const jerseyNum = parseInt(jersey);
    if (isNaN(jerseyNum) || jerseyNum < 1 || jerseyNum > 99) {
      errors.push({ row: actualRow, column: 'Número Jersey', error: 'Debe ser un número entre 1 y 99', value: jersey });
    }
  }

  return errors;
};

export const parsePlayerExcel = async (file: File, teams: any[], categories: any[]): Promise<ParseResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  // Find the players sheet
  let worksheet = workbook.worksheets.find(ws => ws.name.toLowerCase().includes('jugador'));
  if (!worksheet) worksheet = workbook.worksheets[1] || workbook.worksheets[0];
  if (!worksheet) throw new Error('El archivo no contiene hojas de datos');

  // Extract headers from first row
  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value?.toString() || '';
  });

  // Extract data rows
  const jsonData: any[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const rowData: any = {};
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber];
      if (header) {
        rowData[header] = cell.value?.toString() || '';
      }
    });
    if (Object.keys(rowData).length > 0) jsonData.push(rowData);
  });

  if (jsonData.length === 0) {
    throw new Error('El archivo no contiene datos de jugadores');
  }

  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];

  jsonData.forEach((row: any, index: number) => {
    const rowErrors = validatePlayerData(row, index, teams, categories);
    allErrors.push(...rowErrors);
  });

  // Validate duplicate CURPs
  const curps = new Map<string, number[]>();
  jsonData.forEach((row: any, index: number) => {
    const curp = row['CURP']?.toString().trim().toUpperCase();
    if (curp) {
      if (!curps.has(curp)) curps.set(curp, []);
      curps.get(curp)!.push(index + 2);
    }
  });
  curps.forEach((rows, curp) => {
    if (rows.length > 1) {
      rows.forEach(row => {
        allErrors.push({ row, column: 'CURP', error: `CURP duplicado. Este CURP aparece en las filas: ${rows.join(', ')}`, value: curp });
      });
    }
  });

  const players = jsonData.map((row: any) => ({
    teamName: row['Nombre del Equipo']?.toString().trim() || '',
    categoryName: row['Categoría']?.toString().trim() || '',
    firstName: row['Nombre']?.toString().trim() || '',
    paternalSurname: row['Apellido Paterno']?.toString().trim() || '',
    maternalSurname: row['Apellido Materno']?.toString().trim() || '',
    birthDate: row['Fecha Nacimiento (YYYY-MM-DD)']?.toString().trim() || '',
    curp: row['CURP']?.toString().trim().toUpperCase() || '',
    parentName: row['Nombre Tutor']?.toString().trim() || '',
    parentEmail: row['Email Tutor']?.toString().trim() || '',
    parentPhone: row['Teléfono Tutor']?.toString().trim() || '',
    position: row['Posición']?.toString().trim() || '',
    jerseyNumber: row['Número Jersey']?.toString().trim() || ''
  }));

  return { players, errors: allErrors, warnings: allWarnings };
};
