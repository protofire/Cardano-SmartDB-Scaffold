# Definir la carpeta base (puedes cambiar esto por la ruta que necesites)
base_directory="."

# Recorrer todos los directorios dentro del directorio base
for dir in "$base_directory"/*/; do
  if [ -d "$dir" ]; then
    # Eliminar el directorio y todo su contenido
    rm -rf "$dir"
    echo "Eliminado: $dir"
  fi
done
