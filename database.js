const fetch = require("node-fetch");
const { Client } = require("pg");
const unidadesUrl = "https://ensino.ufms.br/unidades/.json";
const cursosUrl = "https://ensino.ufms.br/cursos/.json";

const client = new Client({
  host: "localhost",
  user: "postgres",
  password: "123",
  port: 5432,
  database: "iestagio"
});

async function getUnidades() {
  let result = await fetch(unidadesUrl);
  let data = await result.json();
  return data.centros;
}

async function getCursos() {
  let result = await fetch(cursosUrl);
  let data = await result.json();
  return data.cursos;
}

async function createTableUnidades() {
  const sql = `
    CREATE TABLE unidades (
      id integer NOT NULL PRIMARY KEY,
      nome varchar(255) NOT NULL,
      sigla varchar(255) NOT NULL,
      local varchar(255) NOT NULL,
      cnpj varchar(255) NOT NULL
    );
  `;
  try {
    await client.query(sql);
    console.log("Tabela criada com sucesso!");
  } catch (error) {
    console.log(error);
  }
}

async function createTableCursos() {
  const sql = `
    CREATE TABLE cursos (
      id integer NOT NULL PRIMARY KEY,
      nome varchar(255) NOT NULL, 
      turno varchar(255) NOT NULL, 
      unidade_nome varchar(255) NOT NULL, 
      unidade_id integer NOT NULL,    
      FOREIGN KEY (unidade_id) REFERENCES unidades (id) ON UPDATE CASCADE
    );
  `;
  try {
    await client.query(sql);
    console.log("Tabela criada com sucesso!");
  } catch (error) {
    console.log(error);
  }
}

async function createQueryCursos(array) {
  let query = `INSERT INTO cursos VALUES `;
  array.forEach(curso => {
    query += `('${curso.codigo}', '${curso.nome}', '${curso.turno}', 
      '${curso.centro}', '${curso.centro_id}'),`;
  });
  query = query.substring(0, query.length - 1);
  return query;
}

async function createQueryUnidades(array) {
  let query = `INSERT INTO unidades VALUES `;
  array.forEach(unidade => {
    query += `('${unidade.id}', '${unidade.nome}','${unidade.sigla}', '${
      unidade.local
    }', '${unidade.rodape2.split("CNPJ:")[1].trim()}'),`;
  });
  query = query.substring(0, query.length - 1);
  return query;
}

async function insertAllCursos() {
  try {
    const cursos = await getCursos();
    console.log("Encontrados: " + cursos.length);
    const query = await createQueryCursos(cursos);
    const result = await client.query(query);
    console.log("Inseridos: " + result.rowCount);
  } catch (err) {
    console.log(err);
  }
}

async function insertAllUnidades() {
  try {
    const unidades = await getUnidades();
    console.log("Encontradas: " + unidades.length);
    const query = await createQueryUnidades(unidades);
    const result = await client.query(query);
    console.log("Inseridas: " + result.rowCount);
  } catch (err) {
    console.log(err);
  }
}

client
  .connect()
  .then()
  .catch(error => console.log(error));

(async () => {
  switch (process.argv[2]) {
    case "create":
      if (process.argv[3] == "cursos") await createTableCursos();
      else if (process.argv[3] == "unidades") await createTableUnidades();
      else console.log(`'create ${process.argv[3]}' não implementado.`);
      break;

    case "load":
      if (process.argv[3] == "cursos") await insertAllCursos();
      else if (process.argv[3] == "unidades") await insertAllUnidades();
      else console.log(`'insert all ${process.argv[3]}' não implementado.`);
      break;

    default:
      console.log(
        `usage: <function> <table>\ne.g:\n\tcreate cursos\n\tload cursos`
      );
      break;
  }
  await client.end();
})();
