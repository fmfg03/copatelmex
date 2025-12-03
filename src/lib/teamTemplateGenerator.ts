import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

// Función para normalizar strings (quitar acentos y convertir a minúsculas)
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
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

  // Hoja de instrucciones
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
  
  instructions.forEach((instruction, index) => {
    instructionsSheet.getCell(`A${index + 1}`).value = instruction;
  });

  // Hoja de equipos
  const teamsSheet = workbook.addWorksheet('Equipos');
  
  // Headers
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

  // Datos de ejemplo
  const exampleData = [
    {
      teamName: 'Águilas FC',
      academy: 'Academia Deportiva Central',
      state: categories[0]?.name || '2016',
      phone: '5512345678',
      category: categories[0]?.name || '2016',
      numPlayers: 11,
      m1FirstName: 'Juan',
      m1LastName: 'García',
      m1Email: 'juan.garcia@example.com',
      m1Phone: '5512345678',
      m1Position: 'Director Técnico',
      m2FirstName: 'María',
      m2LastName: 'López',
      m2Email: 'maria.lopez@example.com',
      m2Phone: '5523456789',
      m2Position: 'Auxiliar Técnico'
    },
    {
      teamName: 'Tigres Unidos',
      academy: '',
      state: 'Jalisco',
      phone: '3312345678',
      category: categories[1]?.name || '2017',
      numPlayers: 13,
      m1FirstName: 'Pedro',
      m1LastName: 'Martínez',
      m1Email: 'pedro.martinez@example.com',
      m1Phone: '3312345678',
      m1Position: 'Director Técnico',
      m2FirstName: 'Ana',
      m2LastName: 'Hernández',
      m2Email: 'ana.hernandez@example.com',
      m2Phone: '3323456789',
      m2Position: 'Coordinador'
    }
  ];

  teamsSheet.addRows(exampleData);

  // Aplicar dropdowns para las primeras 100 filas
  const categoriesList = categories.map(c => c.name).join(',');
  
  for (let i = 2; i <= 102; i++) { // Filas 2-102 (después del header)
    // Dropdown para Estado (columna C)
    teamsSheet.getCell(`C${i}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${MEXICAN_STATES.join(',')}"`]
    };
    
    // Dropdown para Categoría (columna E)
    teamsSheet.getCell(`E${i}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${categoriesList}"`]
    };
  }

  // Generar archivo y descargar
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
  const actualRow = rowIndex + 4; // +4 para la fila real (header + 2 ejemplos + index)

  // Validar Nombre del Equipo
  if (!row['Nombre del Equipo']?.toString().trim()) {
    errors.push({ row: actualRow, column: 'Nombre del Equipo', error: 'Campo requerido' });
  } else if (row['Nombre del Equipo'].toString().length > 100) {
    errors.push({ row: actualRow, column: 'Nombre del Equipo', error: 'Máximo 100 caracteres' });
  }

  // Validar Academia (opcional)
  const academy = row['Academia/Escuela']?.toString().trim();
  if (academy && academy.length > 100) {
    errors.push({ row: actualRow, column: 'Academia/Escuela', error: 'Máximo 100 caracteres' });
  }

  // Validar Estado (flexible con mayúsculas/minúsculas y acentos)
  const state = row['Estado']?.toString().trim();
  if (!state) {
    errors.push({ row: actualRow, column: 'Estado', error: 'Campo requerido' });
  } else {
    const normalizedState = normalizeString(state);
    const isValidState = MEXICAN_STATES.some(s => normalizeString(s) === normalizedState);
    if (!isValidState) {
      errors.push({ 
        row: actualRow, 
        column: 'Estado', 
        error: 'Estado no válido. Use el nombre completo del estado', 
        value: state 
      });
    }
  }

  // Validar Teléfono
  const phone = row['Teléfono']?.toString().trim();
  if (!phone) {
    errors.push({ row: actualRow, column: 'Teléfono', error: 'Campo requerido' });
  } else if (phone.length < 10) {
    errors.push({ row: actualRow, column: 'Teléfono', error: 'Mínimo 10 dígitos', value: phone });
  } else if (phone.length > 20) {
    errors.push({ row: actualRow, column: 'Teléfono', error: 'Máximo 20 caracteres' });
  }

  // Validar Categoría (flexible con mayúsculas/minúsculas)
  const category = row['Categoría']?.toString().trim();
  if (!category) {
    errors.push({ row: actualRow, column: 'Categoría', error: 'Campo requerido' });
  } else {
    // Try to match by name or year_born (case insensitive)
    const normalizedCategory = normalizeString(category);
    const matchedCategory = categories.find(c => 
      normalizeString(c.name) === normalizedCategory ||
      c.year_born === category
    );
    if (!matchedCategory) {
      const availableCategories = categories.length > 0 
        ? categories.map(c => `${c.name} (${c.year_born || 'sin año'})`).join(', ')
        : 'No hay categorías disponibles en el sistema';
      errors.push({ 
        row: actualRow, 
        column: 'Categoría', 
        error: `Categoría no válida. Use: ${availableCategories}`, 
        value: category 
      });
    }
  }

  // Validar Número de Jugadores
  const numPlayers = row['Número de Jugadores']?.toString().trim();
  if (!numPlayers) {
    errors.push({ row: actualRow, column: 'Número de Jugadores', error: 'Campo requerido' });
  } else {
    const num = parseInt(numPlayers);
    if (isNaN(num) || num < 7 || num > 17) {
      errors.push({ 
        row: actualRow, 
        column: 'Número de Jugadores', 
        error: 'Debe ser un número entre 7 y 17', 
        value: numPlayers 
      });
    }
  }

  // Validar Manager 1
  if (!row['Manager 1 - Nombre']?.toString().trim()) {
    errors.push({ row: actualRow, column: 'Manager 1 - Nombre', error: 'Campo requerido' });
  }
  if (!row['Manager 1 - Apellido']?.toString().trim()) {
    errors.push({ row: actualRow, column: 'Manager 1 - Apellido', error: 'Campo requerido' });
  }
  
  const manager1Email = row['Manager 1 - Email']?.toString().trim();
  if (!manager1Email) {
    errors.push({ row: actualRow, column: 'Manager 1 - Email', error: 'Campo requerido' });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(manager1Email)) {
      errors.push({ row: actualRow, column: 'Manager 1 - Email', error: 'Email inválido', value: manager1Email });
    }
  }

  const manager1Phone = row['Manager 1 - Teléfono']?.toString().trim();
  if (!manager1Phone) {
    errors.push({ row: actualRow, column: 'Manager 1 - Teléfono', error: 'Campo requerido' });
  } else if (manager1Phone.length < 10) {
    errors.push({ row: actualRow, column: 'Manager 1 - Teléfono', error: 'Mínimo 10 dígitos', value: manager1Phone });
  }

  // Validar Manager 2
  if (!row['Manager 2 - Nombre']?.toString().trim()) {
    errors.push({ row: actualRow, column: 'Manager 2 - Nombre', error: 'Campo requerido' });
  }
  if (!row['Manager 2 - Apellido']?.toString().trim()) {
    errors.push({ row: actualRow, column: 'Manager 2 - Apellido', error: 'Campo requerido' });
  }
  
  const manager2Email = row['Manager 2 - Email']?.toString().trim();
  if (!manager2Email) {
    errors.push({ row: actualRow, column: 'Manager 2 - Email', error: 'Campo requerido' });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(manager2Email)) {
      errors.push({ row: actualRow, column: 'Manager 2 - Email', error: 'Email inválido', value: manager2Email });
    }
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
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const sheetName = workbook.SheetNames.find(name => 
          name.toLowerCase().includes('equipo')
        ) || workbook.SheetNames[1] || workbook.SheetNames[0];
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          reject(new Error('El archivo no contiene datos de equipos'));
          return;
        }

        // Eliminar las primeras 2 filas que son ejemplos de muestra
        const dataWithoutExamples = jsonData.slice(2);
        
        if (dataWithoutExamples.length === 0) {
          reject(new Error('No hay datos de equipos después de las filas de ejemplo'));
          return;
        }

        const allErrors: ValidationError[] = [];
        const allWarnings: ValidationError[] = [];
        
        // Validar cada fila
        dataWithoutExamples.forEach((row: any, index: number) => {
          const rowErrors = validateTeamData(row, index, categories);
          allErrors.push(...rowErrors);
        });

        // Validar equipos duplicados en el Excel
        const teamNames = new Map<string, number[]>();
        dataWithoutExamples.forEach((row: any, index: number) => {
          const teamName = row['Nombre del Equipo']?.toString().trim().toLowerCase();
          if (teamName) {
            if (!teamNames.has(teamName)) {
              teamNames.set(teamName, []);
            }
            teamNames.get(teamName)!.push(index + 4); // +4 para el número de fila real (header + 2 ejemplos + index)
          }
        });

        // Agregar errores para duplicados
        teamNames.forEach((rows, teamName) => {
          if (rows.length > 1) {
            rows.forEach(row => {
              allErrors.push({
                row,
                column: 'Nombre del Equipo',
                error: `Equipo duplicado. Este nombre aparece en las filas: ${rows.join(', ')}`,
                value: teamName
              });
            });
          }
        });

        // Mapear los datos al formato esperado
        const teams = dataWithoutExamples.map((row: any) => {
          const categoryValue = row['Categoría']?.toString().trim();
          const normalizedCategoryValue = normalizeString(categoryValue || '');
          const category = categories.find(c => 
            normalizeString(c.name) === normalizedCategoryValue ||
            c.year_born === categoryValue
          );

          return {
            teamName: row['Nombre del Equipo']?.toString().trim() || '',
            academyName: row['Academia/Escuela']?.toString().trim() || '',
            state: row['Estado']?.toString().trim() || '',
            phoneNumber: row['Teléfono']?.toString().trim() || '',
            categoryId: category?.id || '',
            numberOfPlayers: parseInt(row['Número de Jugadores']?.toString().trim() || '11'),
            shieldFile: null,
            socialPlatform: 'facebook' as const,
            socialHandle: '',
            managers: [
              {
                firstName: row['Manager 1 - Nombre']?.toString().trim() || '',
                lastName: row['Manager 1 - Apellido']?.toString().trim() || '',
                email: row['Manager 1 - Email']?.toString().trim() || '',
                phone: row['Manager 1 - Teléfono']?.toString().trim() || '',
                position: row['Manager 1 - Posición']?.toString().trim() || 'Director Técnico'
              },
              {
                firstName: row['Manager 2 - Nombre']?.toString().trim() || '',
                lastName: row['Manager 2 - Apellido']?.toString().trim() || '',
                email: row['Manager 2 - Email']?.toString().trim() || '',
                phone: row['Manager 2 - Teléfono']?.toString().trim() || '',
                position: row['Manager 2 - Posición']?.toString().trim() || 'Auxiliar Técnico'
              }
            ],
            players: []
          };
        });
        
        resolve({ teams, errors: allErrors, warnings: allWarnings });
      } catch (error) {
        reject(new Error('Error al leer el archivo Excel. Verifica que el formato sea correcto.'));
      }
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsBinaryString(file);
  });
};
