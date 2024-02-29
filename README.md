# MedicaZelda_API
API used in [MedicaZelda](https://github.com/Mthieu44/MedicaZelda/) project

#### Depuis les pc de l'IUT
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash  

export NVM_DIR="$HOME/.config/nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion


# Install better node version than 12.x
nvm install v20.11.0
```

### Run the server 
```bash
# Install dependencies
npm i

# Normal mode
npm start

# Dev mode
nppm run dev 
```



