#!/bin/bash

# Definir la ruta de la carpeta
BACKEND_DIR="./BackEnd"

# Iterar sobre cada archivo .ts en la carpeta
for file in $BACKEND_DIR/BackEnd.*.type.ts; do
  # Obtener el nombre base del archivo
  filename=$(basename -- "$file")
  # Extraer las partes del nombre
  base=${filename#BackEnd.}
  base=${base%.type.ts}
  
  # Convertir la primera letra de Name a mayúscula
  name=$(echo "${base%%.*}" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')
  
  # Construir el nuevo nombre de archivo
  new_filename="${name}.BackEnd.Api.Handlers.ts"
  
  # Renombrar el archivo
  mv "$file" "$BACKEND_DIR/$new_filename"
  
  echo "Renombrado $filename a $new_filename"
done

echo "Archivos renombrados en $BACKEND_DIR"
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
ENTITIES_DIR="./Entities"
# Iterar sobre cada archivo .ts en la carpeta
for file in $ENTITIES_DIR/Entity.*.type.ts; do
  # Obtener el nombre base del archivo
  filename=$(basename -- "$file")
  # Extraer las partes del nombre
  
  # Convertir la primera letra de Name a mayúscula
  if [[ $filename == *.Mongo.*.ts ]]; then
      base=${filename#Entity.Mongo.}
      base=${base%.type.ts}

      name=$(echo "${base%%.*}" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')
      # Construir el nuevo nombre de archivo
      new_filename="${name}.Entity.Mongo.ts"
      
      # Renombrar el archivo
      mv "$file" "$BACKEND_DIR/$new_filename"
    else
      base=${filename#Entity.}
      base=${base%.type.ts}

      name=$(echo "${base%%.*}" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')
      # Construir el nuevo nombre de archivo
      new_filename="${name}.Entity.ts"
      
      # Renombrar el archivo
      mv "$file" "$ENTITIES_DIR/$new_filename"
    fi

    echo "Renombrado $filename a $new_filename"
done

echo "Archivos renombrados en $ENTITIES_DIR"
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
echo "export * from './index';" >> $INDEX_DB_FILE

echo "index.ts generado en $ENTITIES_DIR"
echo "index.mongo.ts generado en $ENTITIES_DIR"

# Definir la ruta de la carpeta
FRONTEND_DIR="./FrontEnd"

# Iterar sobre cada archivo .ts en la carpeta
for file in $FRONTEND_DIR/FrontEnd.*.type.ts; do
  # Obtener el nombre base del archivo
  filename=$(basename -- "$file")
  # Extraer las partes del nombre
  base=${filename#FrontEnd.}
  base=${base%.type.ts}
  
  # Convertir la primera letra de Name a mayúscula
  name=$(echo "${base%%.*}" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')
  
  # Construir el nuevo nombre de archivo
  new_filename="${name}.FrontEnd.Api.Calls.ts"
  
  # Renombrar el archivo
  mv "$file" "$FRONTEND_DIR/$new_filename"
  
  echo "Renombrado $filename a $new_filename"
done

echo "Archivos renombrados en $FRONTEND_DIR"

