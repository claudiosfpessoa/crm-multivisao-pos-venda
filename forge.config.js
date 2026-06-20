module.exports = {
  packagerConfig: {
    asar: true,
    executableName: "CRM-Pos-Venda"
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "CRMMultivisaoPosVenda",
        title: "CRM Pós-venda Multivisão",
        setupExe: "CRM-Pos-Venda-Setup.exe",
        setupIcon: "./icons/app-icon.ico"
      }
    }
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "claudiosfpessoa",
          name: "crm-multivisao-pos-venda"
        },
        draft: true,
        prerelease: false
      }
    }
  ]
};
