
#!/bin/bash

# Recorrer todos los archivos que coincidan con el formato components.*.type.ts
for file in components.*.type.ts; do
  # Extraer la palabra que se encuentra entre "components." y ".type.ts"
  ls file &&
  base_name=$(echo "$file" | sed -e 's/^components\.\(.*\)\.type\.ts$/\1/')
  
  # Convertir la primera letra de la palabra a mayúscula
  dir_name=$(echo "$base_name" | sed 's/^\(.\)/\U\1/')
  
  # Crear la carpeta con el nombre en mayúscula si no existe
  if [ ! -d "$dir_name" ]; then
    mkdir "$dir_name"
    echo "Carpeta creada: $dir_name"
  fi
  
  # Renombrar y mover el archivo a la carpeta correspondiente
  new_tsx_name="$dir_name/$dir_name.tsx"
  mv "$file" "$new_tsx_name"
  echo "Movido y renombrado: $file -> $new_tsx_name"
  
  # Copiar el archivo components.module.scss y renombrarlo
  if [ -f "components.module.scss" ]; then
    new_scss_name="$dir_name/$dir_name.module.scss"
    cp components.module.scss "$new_scss_name"
    echo "Copiado: components.module.scss -> $new_scss_name"
  else
    echo "El archivo components.module.scss no existe."
  fi
done

