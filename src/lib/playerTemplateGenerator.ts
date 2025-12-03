import * as XLSX from 'xlsx';

export const generatePlayerTemplate = () => {
  // Datos de ejemplo
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

  // Instrucciones
  const instructions = [
    { 'INSTRUCCIONES': '1. Complete los datos de cada jugador en las filas siguientes' },
    { 'INSTRUCCIONES': '2. Los ejemplos pueden ser eliminados' },
    { 'INSTRUCCIONES': '3. Nombre del Equipo: Debe coincidir EXACTAMENTE con el nombre de uno de sus equipos registrados' },
    { 'INSTRUCCIONES': '4. Categoría: Debe coincidir con la categoría del equipo' },
    { 'INSTRUCCIONES': '5. CURP: OBLIGATORIO - Debe tener exactamente 18 caracteres en MAYÚSCULAS' },
    { 'INSTRUCCIONES': '6. Fecha: Formato YYYY-MM-DD (ejemplo: 2015-03-15)' },
    { 'INSTRUCCIONES': '7. Teléfono: Mínimo 10 dígitos' },
    { 'INSTRUCCIONES': '8. Número Jersey: Entre 1 y 99' },
    { 'INSTRUCCIONES': '9. Posición: Campo opcional (Portero, Defensa, Medio, Delantero)' },
    { 'INSTRUCCIONES': '' },
    { 'INSTRUCCIONES': 'IMPORTANTE: Mantenga los nombres de las columnas exactamente como están' }
  ];

  // Crear workbook
  const wb = XLSX.utils.book_new();

  // Agregar hoja de instrucciones
  const wsInstructions = XLSX.utils.json_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 80 }]; // Ancho de columna
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones');

  // Agregar hoja de jugadores
  const wsPlayers = XLSX.utils.json_to_sheet(exampleData);
  
  // Configurar ancho de columnas
  wsPlayers['!cols'] = [
    { wch: 25 }, // Nombre del Equipo
    { wch: 15 }, // Categoría
    { wch: 15 }, // Nombre
    { wch: 18 }, // Apellido Paterno
    { wch: 18 }, // Apellido Materno
    { wch: 28 }, // Fecha Nacimiento
    { wch: 20 }, // CURP
    { wch: 20 }, // Nombre Tutor
    { wch: 28 }, // Email Tutor
    { wch: 18 }, // Teléfono Tutor
    { wch: 15 }, // Posición
    { wch: 15 }  // Número Jersey
  ];
  
  XLSX.utils.book_append_sheet(wb, wsPlayers, 'Jugadores');

  // Generar archivo y descargar
  XLSX.writeFile(wb, 'plantilla-carga-jugadores.xlsx');
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
  const actualRow = rowIndex + 2; // +2 porque la fila 1 son headers y empezamos en 0

  // Validar Nombre del Equipo
  const teamName = row['Nombre del Equipo']?.toString().trim();
  if (!teamName) {
    errors.push({ row: actualRow, column: 'Nombre del Equipo', error: 'Campo requerido' });
  } else {
    const team = teams.find(t => t.teamName.toLowerCase() === teamName.toLowerCase());
    if (!team) {
      errors.push({ row: actualRow, column: 'Nombre del Equipo', error: 'El equipo no existe en sus equipos registrados', value: teamName });
    }
  }

  // Validar Categoría
  const categoryName = row['Categoría']?.toString().trim();
  if (!categoryName) {
    errors.push({ row: actualRow, column: 'Categoría', error: 'Campo requerido' });
  } else {
    const category = categories.find(c => c.name === categoryName);
    if (!category) {
      errors.push({ row: actualRow, column: 'Categoría', error: 'Categoría no válida', value: categoryName });
    }
  }

  // Validar Nombre
  if (!row['Nombre']?.toString().trim()) {
    errors.push({ row: actualRow, column: 'Nombre', error: 'Campo requerido' });
  } else if (row['Nombre'].toString().length > 100) {
    errors.push({ row: actualRow, column: 'Nombre', error: 'Máximo 100 caracteres', value: row['Nombre'] });
  }

  // Validar Apellido Paterno
  if (!row['Apellido Paterno']?.toString().trim()) {
    errors.push({ row: actualRow, column: 'Apellido Paterno', error: 'Campo requerido' });
  } else if (row['Apellido Paterno'].toString().length > 100) {
    errors.push({ row: actualRow, column: 'Apellido Paterno', error: 'Máximo 100 caracteres' });
  }

  // Validar Apellido Materno
  if (!row['Apellido Materno']?.toString().trim()) {
    errors.push({ row: actualRow, column: 'Apellido Materno', error: 'Campo requerido' });
  } else if (row['Apellido Materno'].toString().length > 100) {
    errors.push({ row: actualRow, column: 'Apellido Materno', error: 'Máximo 100 caracteres' });
  }

  // Validar Fecha de Nacimiento
  const birthDate = row['Fecha Nacimiento (YYYY-MM-DD)']?.toString().trim();
  if (!birthDate) {
    errors.push({ row: actualRow, column: 'Fecha Nacimiento', error: 'Campo requerido' });
  } else {
    // Validar formato YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthDate)) {
      errors.push({ row: actualRow, column: 'Fecha Nacimiento', error: 'Formato inválido. Use YYYY-MM-DD', value: birthDate });
    } else {
      // Validar que sea una fecha válida
      const date = new Date(birthDate);
      if (isNaN(date.getTime())) {
        errors.push({ row: actualRow, column: 'Fecha Nacimiento', error: 'Fecha inválida', value: birthDate });
      }
    }
  }

  // Validar CURP
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

  // Validar Nombre Tutor
  if (!row['Nombre Tutor']?.toString().trim()) {
    errors.push({ row: actualRow, column: 'Nombre Tutor', error: 'Campo requerido' });
  } else if (row['Nombre Tutor'].toString().length > 100) {
    errors.push({ row: actualRow, column: 'Nombre Tutor', error: 'Máximo 100 caracteres' });
  }

  // Validar Email Tutor
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

  // Validar Teléfono Tutor
  const phone = row['Teléfono Tutor']?.toString().trim();
  if (!phone) {
    errors.push({ row: actualRow, column: 'Teléfono Tutor', error: 'Campo requerido' });
  } else if (phone.length < 10) {
    errors.push({ row: actualRow, column: 'Teléfono Tutor', error: 'Mínimo 10 dígitos', value: phone });
  } else if (phone.length > 20) {
    errors.push({ row: actualRow, column: 'Teléfono Tutor', error: 'Máximo 20 caracteres' });
  }

  // Validar Posición (opcional)
  const position = row['Posición']?.toString().trim();
  if (position && position.length > 50) {
    errors.push({ row: actualRow, column: 'Posición', error: 'Máximo 50 caracteres' });
  }

  // Validar Número Jersey
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
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Buscar la hoja de jugadores
        const sheetName = workbook.SheetNames.find(name => 
          name.toLowerCase().includes('jugador')
        ) || workbook.SheetNames[1] || workbook.SheetNames[0];
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          reject(new Error('El archivo no contiene datos de jugadores'));
          return;
        }

        const allErrors: ValidationError[] = [];
        const allWarnings: ValidationError[] = [];
        
        // Validar cada fila
        jsonData.forEach((row: any, index: number) => {
          const rowErrors = validatePlayerData(row, index, teams, categories);
          allErrors.push(...rowErrors);
        });

        // Validar CURPs duplicados en el Excel
        const curps = new Map<string, number[]>();
        jsonData.forEach((row: any, index: number) => {
          const curp = row['CURP']?.toString().trim().toUpperCase();
          if (curp) {
            if (!curps.has(curp)) {
              curps.set(curp, []);
            }
            curps.get(curp)!.push(index + 2);
          }
        });

        // Agregar errores para CURPs duplicados
        curps.forEach((rows, curp) => {
          if (rows.length > 1) {
            rows.forEach(row => {
              allErrors.push({
                row,
                column: 'CURP',
                error: `CURP duplicado. Este CURP aparece en las filas: ${rows.join(', ')}`,
                value: curp
              });
            });
          }
        });

        // Mapear los datos al formato esperado
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
        
        resolve({ players, errors: allErrors, warnings: allWarnings });
      } catch (error) {
        reject(new Error('Error al leer el archivo Excel. Verifica que el formato sea correcto.'));
      }
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsBinaryString(file);
  });
};
