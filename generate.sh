#!/bin/bash

# Definir la ruta de la carpeta
BACKEND_DIR="./src/BackEnd"

# Definir la ruta del archivo index.ts
INDEX_FILE="$BACKEND_DIR/index.ts"

# Eliminar el archivo index.ts si ya existe
rm -f $INDEX_FILE

# Iterar sobre cada archivo .ts en la carpeta, excluyendo el index.ts
for file in $BACKEND_DIR/*.ts; do
  filename=$(basename -- "$file")
  # Omitir si el archivo es index.ts
  if [ "$filename" != "index.ts" ]; then
    # Quitar la extensión del archivo
    name="${filename%.*}"
    # Agregar la línea de exportación al archivo index.ts
    echo "export * from './$name';" >> $INDEX_FILE
  fi
done

echo "index.ts generado en $BACKEND_DIR"

# Definir la ruta de la carpeta
ENTITIES_DIR="./src/Entities"

# Definir la ruta del archivo index.ts
INDEX_FILE="$ENTITIES_DIR/index.ts"
INDEX_DB_FILE="$ENTITIES_DIR/index.BackEnd.ts"

# Eliminar el archivo index.ts si ya existe
rm -f $INDEX_FILE
rm -f $INDEX_DB_FILE

# Iterar sobre cada archivo .ts en la carpeta
for file in $ENTITIES_DIR/*.ts; do
  filename=$(basename -- "$file")
  # Omitir si el archivo es index.ts o index.mongo.ts
  if [ "$filename" != "index.ts" ] && [ "$filename" != "index.BackEnd.ts" ]; then
    # Quitar la extensión del archivo
    name="${filename%.*}"
    if [[ $filename == *.Mongo.*.ts ]]; then
      # Agregar la línea de exportación al archivo index.mongo.ts
      echo "export * from './$name';" >> $INDEX_DB_FILE
    else
      # Agregar la línea de exportación al archivo index.ts
      echo "export * from './$name';" >> $INDEX_FILE
    fi
  fi
done

echo "index.ts generado en $ENTITIES_DIR"
echo "index.mongo.ts generado en $ENTITIES_DIR"


