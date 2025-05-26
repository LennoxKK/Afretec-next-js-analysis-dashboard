// lib/database.js
import mysql from 'mysql2/promise';


const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'lavarel'
};

export async function createConnection() {
  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export async function getDiseases() {
  const connection = await createConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM diseases WHERE is_active = 1 ORDER BY disease_name'
    );
    return rows;
  } finally {
    await connection.end();
  }
}

export async function getQuestions(diseaseId = null) {
  const connection = await createConnection();
  try {
    let query = 'SELECT * FROM questions WHERE is_active = 1';
    let params = [];
    
    if (diseaseId) {
      query += ' AND disease_id = ?';
      params.push(diseaseId);
    }
    
    query += ' ORDER BY disease_id, `order`';
    
    const [rows] = await connection.execute(query, params);
    return rows;
  } finally {
    await connection.end();
  }
}

export async function getChoices(questionId = null) {
  const connection = await createConnection();
  try {
    let query = 'SELECT * FROM choices';
    let params = [];
    
    if (questionId) {
      query += ' WHERE question_id = ?';
      params.push(questionId);
    }
    
    query += ' ORDER BY question_id, choice_order';
    
    const [rows] = await connection.execute(query, params);
    return rows;
  } finally {
    await connection.end();
  }
}

export async function getResponses(filters = {}) {
  const connection = await createConnection();
  try {
    let query = `
      SELECT 
        r.id,
        r.responder_id,
        d.disease_name,
        q.question_text,
        c.choice_text,
        r.created_at
      FROM responses r
      JOIN diseases d ON r.disease_id = d.disease_id
      JOIN questions q ON r.question_id = q.id
      JOIN choices c ON r.choice_id = c.id
      WHERE d.is_active = 1 AND q.is_active = 1
    `;
    
    let params = [];
    
    if (filters.diseases && filters.diseases.length > 0) {
      const placeholders = filters.diseases.map(() => '?').join(',');
      query += ` AND d.disease_name IN (${placeholders})`;
      params.push(...filters.diseases);
    }
    
    if (filters.questions && filters.questions.length > 0) {
      const placeholders = filters.questions.map(() => '?').join(',');
      query += ` AND q.id IN (${placeholders})`;
      params.push(...filters.questions);
    }
    
    query += ' ORDER BY r.created_at DESC';
    
    const [rows] = await connection.execute(query, params);
    return rows;
  } finally {
    await connection.end();
  }
}

// export async function getAnalyticsData(diseases = [], variables = []) {
//   const connection = await createConnection();
//   try {
//     // Map variables to question patterns
//     const questionPatterns = {
//       'gender': '%Male or Female%',
//       'age': '%older than 35%',
//       'season': '%rainy season%',
//       'family': '%more than four%',
//       'climate': '%climate change%'
//     };
    
//     let query = `
//       SELECT 
//         d.disease_name,
//         q.question_text,
//         c.choice_text,
//         COUNT(*) as response_count
//       FROM responses r
//       JOIN diseases d ON r.disease_id = d.disease_id
//       JOIN questions q ON r.question_id = q.id
//       JOIN choices c ON r.choice_id = c.id
//       WHERE d.is_active = 1 AND q.is_active = 1
//     `;
    
//     let params = [];
    
//     // Filter by diseases
//     if (diseases.length > 0) {
//       const placeholders = diseases.map(() => '?').join(',');
//       query += ` AND d.disease_name IN (${placeholders})`;
//       params.push(...diseases);
//     }
    
//     // Filter by variables (questions)
//     if (variables.length > 0) {
//       const variableConditions = variables.map(variable => {
//         if (questionPatterns[variable]) {
//           return 'q.question_text LIKE ?';
//         }
//         return null;
//       }).filter(Boolean);
      
//       if (variableConditions.length > 0) {
//         query += ` AND (${variableConditions.join(' OR ')})`;
//         variables.forEach(variable => {
//           if (questionPatterns[variable]) {
//             params.push(questionPatterns[variable]);
//           }
//         });
//       }
//     }
    
//     query += `
//       GROUP BY d.disease_name, q.question_text, c.choice_text
//       ORDER BY d.disease_name, q.question_text, response_count DESC
//     `;
    
//     const [rows] = await connection.execute(query, params);
//     return rows;
//   } finally {
//     await connection.end();
//   }
// }

export async function getAnalyticsData(diseases = [], variables = []) {

const connection = await createConnection();
try {
  // Map variables to question patterns
  const questionPatterns = {
    'gender': '%Male or Female%',
    'age': '%older than 35%',
    'season': '%rainy season%',
    'familySize': '%more than four%',
    'climateChangeAwareness': '%climate change%',
    'location': '%health facility%',
    'malariaTreatmentLastYear': '%treated for malaria last year%',
    'malariaIncrease': '%more last year than previous%',
    'weatherImpact': '%weather conditions are affecting%',
    'preventionTipsInterest': '%malaria prevention tips%'
  };
  
  let query = `
    SELECT 
      d.disease_name,
      q.question_text,
      c.choice_text,
      COUNT(*) as response_count
    FROM responses r
    JOIN diseases d ON r.disease_id = d.disease_id
    JOIN questions q ON r.question_id = q.id
    JOIN choices c ON r.choice_id = c.id
    WHERE d.is_active = 1 AND q.is_active = 1
  `;
  
  let params = [];
  
  // Filter by diseases
  if (diseases.length > 0) {
    const placeholders = diseases.map(() => '?').join(',');
    query += ` AND LOWER(d.disease_name) IN (${placeholders})`;
    params.push(...diseases.map(d => d.toLowerCase()));
  }
  
  // Filter by variables (questions)
  if (variables.length > 0) {
    const variableConditions = variables.map(variable => {
      if (questionPatterns[variable]) {
        return 'q.question_text LIKE ?';
      }
      return null;
    }).filter(Boolean);
    
    if (variableConditions.length > 0) {
      query += ` AND (${variableConditions.join(' OR ')})`;
      variables.forEach(variable => {
        if (questionPatterns[variable]) {
          params.push(questionPatterns[variable]);
        }
      });
    }
  }
  
  query += `
    GROUP BY d.disease_name, q.question_text, c.choice_text
    ORDER BY d.disease_name, q.question_text, response_count DESC
  `;
  
  const [rows] = await connection.execute(query, params);
  return rows;
} finally {
  await connection.end();
}
}

export async function getResponderCount() {
  const connection = await createConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT COUNT(DISTINCT responder_id) as total_responders FROM responses'
    );
    return rows[0].total_responders;
  } finally {
    await connection.end();
  }
}

export async function getTotalResponses() {
    const connection = await createConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT COUNT(*) as total FROM responses'
      );
      return rows[0].total;
    } finally {
      await connection.end();
    }
  }

  export async function getGroupedResponsesJSON() {
    const connection = await createConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT 
          r.responder_id,
          d.disease_name,
          q.question_text,
          c.choice_text
        FROM responses r
        JOIN diseases d ON r.disease_id = d.disease_id
        JOIN questions q ON r.question_id = q.id
        JOIN choices c ON r.choice_id = c.id
        WHERE d.is_active = 1 AND q.is_active = 1
      `);
  
      const diseaseMap = {};
  
      for (const row of rows) {
        const { responder_id, disease_name, question_text, choice_text } = row;
  
        // Ensure disease group exists
        if (!diseaseMap[disease_name]) {
          diseaseMap[disease_name] = [];
        }
  
        // Push each individual response entry
        diseaseMap[disease_name].push({
          responder_id,
          question: question_text,
          answer: choice_text
        });
      }
  
      return diseaseMap;
    } finally {
      await connection.end();
    }
  }
  