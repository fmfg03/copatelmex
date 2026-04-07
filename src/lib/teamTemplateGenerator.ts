import ExcelJS from 'exceljs';

const normalizeString = (str: string): string => {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const MEXICAN_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
  'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
  'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

export const generateTeamTemplate = async (categories: any[]) => {
  const workbook = new ExcelJS.Workbook();

  const instructionsSheet = workbook.addWorksheet('Instrucciones');
  instructionsSheet.getColumn(1).width = 100;
  const instructions = [
    '1. Complete los datos de cada equipo en las filas siguientes',
    '2. Los ejemplos pueden ser eliminados',
    '3. Nombre del Equipo: Campo requerido, máximo 100 caracteres',
    '4. Academia/Escuela: Campo opcional, máximo 100 caracteres',
    '5. Estado: Campo requerido, use el dropdown para seleccionar',
    '6. Teléfono: Mínimo 10 dígitos, máximo 20',
    `7. Categoría: Use el dropdown para seleccionar una de: ${categories.map(c => c.name).join(', ')}`,
    '8. Número de Jugadores: Entre 7 y 17',
    '9. Managers: Se requieren exactamente 2 managers por equipo',
    '10. Email Manager: Formato válido de email',
    '11. Teléfono Manager: Mínimo 10 dígitos',
    '',
    'IMPORTANTE: Mantenga los nombres de las columnas exactamente como están'
  ];
  instructions.forEach(text => instructionsSheet.addRow([text]));

  const teamsSheet = workbook.addWorksheet('Equipos');
  teamsSheet.columns = [
    { header: 'Nombre del Equipo', key: 'teamName', width: 25 },
    { header: 'Academia/Escuela', key: 'academy', width: 30 },
    { header: 'Estado', key: 'state', width: 25 },
    { header: 'Teléfono', key: 'phone', width: 15 },
    { header: 'Categoría', key: 'category', width: 15 },
    { header: 'Número de Jugadores', key: 'numPlayers', width: 20 },
    { header: 'Manager 1 - Nombre', key: 'm1FirstName', width: 20 },
    { header: 'Manager 1 - Apellido', key: 'm1LastName', width: 20 },
    { header: 'Manager 1 - Email', key: 'm1Email', width: 30 },
    { header: 'Manager 1 - Teléfono', key: 'm1Phone', width: 18 },
    { header: 'Manager 1 - Posición', key: 'm1Position', width: 22 },
    { header: 'Manager 2 - Nombre', key: 'm2FirstName', width: 20 },
    { header: 'Manager 2 - Apellido', key: 'm2LastName', width: 20 },
    { header: 'Manager 2 - Email', key: 'm2Email', width: 30 },
    { header: 'Manager 2 - Teléfono', key: 'm2Phone', width: 18 },
    { header: 'Manager 2 - Posición', key: 'm2Position', width: 22 }
  ];

  teamsSheet.addRows([
    { teamName: 'Águilas FC', academy: 'Academia Deportiva Central', state: categories[0]?.name || '2016', phone: '5512345678', category: categories[0]?.name || '2016', numPlayers: 11, m1FirstName: 'Juan', m1LastName: 'García', m1Email: 'juan.garcia@example.com', m1Phone: '5512345678', m1Position: 'Director Técnico', m2FirstName: 'María', m2LastName: 'López', m2Email: 'maria.lopez@example.com', m2Phone: '5523456789', m2Position: 'Auxiliar Técnico' },
    { teamName: 'Tigres Unidos', academy: '', state: 'Jalisco', phone: '3312345678', category: categories[1]?.name || '2017', numPlayers: 13, m1FirstName: 'Pedro', m1LastName: 'Martínez', m1Email: 'pedro.martinez@example.com', m1Phone: '3312345678', m1Position: 'Director Técnico', m2FirstName: 'Ana', m2LastName: 'Hernández', m2Email: 'ana.hernandez@example.com', m2Phone: '3323456789', m2Position: 'Coordinador' }
  ]);

  const categoriesList = categories.map(c => c.name).join(',');
  for (let i = 2; i <= 102; i++) {
    teamsSheet.getCell(`C${i}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${MEXICAN_STATES.join(',')}"`]
    };
    teamsSheet.getCell(`E${i}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${categoriesList}"`]
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plantilla-carga-equipos.xlsx';
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
  teams: any[];
  errors: ValidationError[];
  warnings: ValidationError[];
}

const validateTeamData = (row: any, rowIndex: number, categories: any[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  const actualRow = rowIndex + 4;

  if (!row['Nombre del Equipo']?.toString().trim()) {
    errors.push({ row: actualRow, column: 'Nombre del Equipo', error: 'Campo requerido' });
  } else if (row['Nombre del Equipo'].toString().length > 100) {
    errors.push({ row: actualRow, column: 'Nombre del Equipo', error: 'Máximo 100 caracteres' });
  }

  const academy = row['Academia/Escuela']?.toString().trim();
  if (academy && academy.length > 100) {
    errors.push({ row: actualRow, column: 'Academia/Escuela', error: 'Máximo 100 caracteres' });
  }

  const state = row['Estado']?.toString().trim();
  if (!state) {
    errors.push({ row: actualRow, column: 'Estado', error: 'Campo requerido' });
  } else {
    const normalizedState = normalizeString(state);
    const isValidState = MEXICAN_STATES.some(s => normalizeString(s) === normalizedState);
    if (!isValidState) {
      errors.push({ row: actualRow, column: 'Estado', error: 'Estado no válido. Use el nombre completo del estado', value: state });
    }
  }

  const phone = row['Teléfono']?.toString().trim();
  if (!phone) {
    errors.push({ row: actualRow, column: 'Teléfono', error: 'Campo requerido' });
  } else if (phone.length < 10) {
    errors.push({ row: actualRow, column: 'Teléfono', error: 'Mínimo 10 dígitos', value: phone });
  } else if (phone.length > 20) {
    errors.push({ row: actualRow, column: 'Teléfono', error: 'Máximo 20 caracteres' });
  }

  const category = row['Categoría']?.toString().trim();
  if (!category) {
    errors.push({ row: actualRow, column: 'Categoría', error: 'Campo requerido' });
  } else {
    const normalizedCategory = normalizeString(category);
    const matchedCategory = categories.find(c => normalizeString(c.name) === normalizedCategory || c.year_born === category);
    if (!matchedCategory) {
      const availableCategories = categories.length > 0 
        ? categories.map(c => `${c.name} (${c.year_born || 'sin año'})`).join(', ')
        : 'No hay categorías disponibles en el sistema';
      errors.push({ row: actualRow, column: 'Categoría', error: `Categoría no válida. Use: ${availableCategories}`, value: category });
    }
  }

  const numPlayers = row['Número de Jugadores']?.toString().trim();
  if (!numPlayers) {
    errors.push({ row: actualRow, column: 'Número de Jugadores', error: 'Campo requerido' });
  } else {
    const num = parseInt(numPlayers);
    if (isNaN(num) || num < 7 || num > 17) {
      errors.push({ row: actualRow, column: 'Número de Jugadores', error: 'Debe ser un número entre 7 y 17', value: numPlayers });
    }
  }

  if (!row['Manager 1 - Nombre']?.toString().trim()) errors.push({ row: actualRow, column: 'Manager 1 - Nombre', error: 'Campo requerido' });
  if (!row['Manager 1 - Apellido']?.toString().trim()) errors.push({ row: actualRow, column: 'Manager 1 - Apellido', error: 'Campo requerido' });

  const manager1Email = row['Manager 1 - Email']?.toString().trim();
  if (!manager1Email) {
    errors.push({ row: actualRow, column: 'Manager 1 - Email', error: 'Campo requerido' });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(manager1Email)) errors.push({ row: actualRow, column: 'Manager 1 - Email', error: 'Email inválido', value: manager1Email });
  }

  const manager1Phone = row['Manager 1 - Teléfono']?.toString().trim();
  if (!manager1Phone) {
    errors.push({ row: actualRow, column: 'Manager 1 - Teléfono', error: 'Campo requerido' });
  } else if (manager1Phone.length < 10) {
    errors.push({ row: actualRow, column: 'Manager 1 - Teléfono', error: 'Mínimo 10 dígitos', value: manager1Phone });
  }

  if (!row['Manager 2 - Nombre']?.toString().trim()) errors.push({ row: actualRow, column: 'Manager 2 - Nombre', error: 'Campo requerido' });
  if (!row['Manager 2 - Apellido']?.toString().trim()) errors.push({ row: actualRow, column: 'Manager 2 - Apellido', error: 'Campo requerido' });

  const manager2Email = row['Manager 2 - Email']?.toString().trim();
  if (!manager2Email) {
    errors.push({ row: actualRow, column: 'Manager 2 - Email', error: 'Campo requerido' });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(manager2Email)) errors.push({ row: actualRow, column: 'Manager 2 - Email', error: 'Email inválido', value: manager2Email });
  }

  const manager2Phone = row['Manager 2 - Teléfono']?.toString().trim();
  if (!manager2Phone) {
    errors.push({ row: actualRow, column: 'Manager 2 - Teléfono', error: 'Campo requerido' });
  } else if (manager2Phone.length < 10) {
    errors.push({ row: actualRow, column: 'Manager 2 - Teléfono', error: 'Mínimo 10 dígitos', value: manager2Phone });
  }

  return errors;
};

export const parseTeamExcel = async (file: File, categories: any[]): Promise<ParseResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  let worksheet = workbook.worksheets.find(ws => ws.name.toLowerCase().includes('equipo'));
  if (!worksheet) worksheet = workbook.worksheets[1] || workbook.worksheets[0];
  if (!worksheet) throw new Error('El archivo no contiene hojas de datos');

  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value?.toString() || '';
  });

  const jsonData: any[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const rowData: any = {};
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber];
      if (header) rowData[header] = cell.value?.toString() || '';
    });
    if (Object.keys(rowData).length > 0) jsonData.push(rowData);
  });

  if (jsonData.length === 0) throw new Error('El archivo no contiene datos de equipos');

  const dataWithoutExamples = jsonData.slice(2);
  if (dataWithoutExamples.length === 0) throw new Error('No hay datos de equipos después de las filas de ejemplo');

  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];

  dataWithoutExamples.forEach((row: any, index: number) => {
    allErrors.push(...validateTeamData(row, index, categories));
  });

  const teamNames = new Map<string, number[]>();
  dataWithoutExamples.forEach((row: any, index: number) => {
    const teamName = row['Nombre del Equipo']?.toString().trim().toLowerCase();
    if (teamName) {
      if (!teamNames.has(teamName)) teamNames.set(teamName, []);
      teamNames.get(teamName)!.push(index + 4);
    }
  });
  teamNames.forEach((rows, teamName) => {
    if (rows.length > 1) {
      rows.forEach(row => {
        allErrors.push({ row, column: 'Nombre del Equipo', error: `Equipo duplicado. Este nombre aparece en las filas: ${rows.join(', ')}`, value: teamName });
      });
    }
  });

  const teams = dataWithoutExamples.map((row: any) => {
    const categoryValue = row['Categoría']?.toString().trim();
    const normalizedCategoryValue = normalizeString(categoryValue || '');
    const cat = categories.find(c => normalizeString(c.name) === normalizedCategoryValue || c.year_born === categoryValue);
    return {
      teamName: row['Nombre del Equipo']?.toString().trim() || '',
      academyName: row['Academia/Escuela']?.toString().trim() || '',
      state: row['Estado']?.toString().trim() || '',
      phoneNumber: row['Teléfono']?.toString().trim() || '',
      categoryId: cat?.id || '',
      numberOfPlayers: parseInt(row['Número de Jugadores']?.toString().trim() || '11'),
      shieldFile: null,
      socialPlatform: 'facebook' as const,
      socialHandle: '',
      managers: [
        { firstName: row['Manager 1 - Nombre']?.toString().trim() || '', lastName: row['Manager 1 - Apellido']?.toString().trim() || '', email: row['Manager 1 - Email']?.toString().trim() || '', phone: row['Manager 1 - Teléfono']?.toString().trim() || '', position: row['Manager 1 - Posición']?.toString().trim() || 'Director Técnico' },
        { firstName: row['Manager 2 - Nombre']?.toString().trim() || '', lastName: row['Manager 2 - Apellido']?.toString().trim() || '', email: row['Manager 2 - Email']?.toString().trim() || '', phone: row['Manager 2 - Teléfono']?.toString().trim() || '', position: row['Manager 2 - Posición']?.toString().trim() || 'Auxiliar Técnico' },
      ],
      players: []
    };
  });

  return { teams, errors: allErrors, warnings: allWarnings };
};
