#!/bin/bash
# Recorrer todos los archivos que coincidan con el formato page.*.type.ts
for file in page.*.type.ts; do
  # Extraer la palabra que se encuentra entre "page." y ".type.ts"
  base_name=$(echo "$file" | sed -e 's/^page\.\(.*\)\.type\.ts$/\1/')
  
  # Convertir la primera letra de la palabra a mayúscula
  new_name=$(echo "$base_name" | sed 's/^\(.\)/\U\1/')
  
  # Crear el nuevo nombre de archivo con el formato Nombre.ts
  new_file="$new_name.ts"
  
  # Renombrar el archivo
  mv "$file" "$new_file"
  
  # Mostrar el cambio realizado
  echo "Renombrado: $file -> $new_file"
done

