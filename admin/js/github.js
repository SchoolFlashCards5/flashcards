(function(global){

  const STORE = "sfc_admin_auth";


  const settings = () =>
    JSON.parse(
      localStorage.getItem("sfc_admin_settings") || "{}"
    );


  const auth = () =>
    JSON.parse(
      localStorage.getItem(STORE) || "{}"
    );


  const saveAuth = (a) =>
    localStorage.setItem(
      STORE,
      JSON.stringify(a)
    );



  async function api(path, options = {}) {

    const token = auth().access_token;

    if (!token) {
      throw new Error("Sign in with GitHub first.");
    }


    const res = await fetch(
      `https://api.github.com${path}`,
      {
        ...options,

        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          ...(options.headers || {})
        }
      }
    );


    const data =
      await res.json()
      .catch(() => ({}));


    if (!res.ok) {

      throw new Error(
        data.message ||
        `GitHub API error ${res.status}`
      );

    }


    return data;

  }





  async function login(){

    const s = settings();


    if (!s.workerUrl) {

      throw new Error(
        "Cloudflare Worker URL missing."
      );

    }



    const res = await fetch(
      s.workerUrl
    );


    const data =
      await res.json();


    if (!data.token) {

      throw new Error(
        data.error ||
        "Failed getting GitHub App token."
      );

    }


    saveAuth({

      access_token: data.token,

      created_at: Date.now()

    });


  }





  function logout(){

    localStorage.removeItem(
      STORE
    );

  }






  async function getCurrentUser(){

    const s = settings();


    return {

      login: s.owner,

      name: "GitHub App"

    };

  }






  async function getFile(path){

    const s = settings();


    return api(
      `/repos/${s.owner}/${s.repo}/contents/${path}?ref=${encodeURIComponent(
        s.branch || "main"
      )}`
    );

  }







  async function putFile(
    path,
    content,
    message,
    sha
  ){

    const s = settings();


    return api(
      `/repos/${s.owner}/${s.repo}/contents/${path}`,
      {

        method: "PUT",


        headers: {

          "Content-Type":
          "application/json"

        },


        body: JSON.stringify({

          message,

          content:
          btoa(
            unescape(
              encodeURIComponent(content)
            )
          ),

          sha,

          branch:
          s.branch || "main"

        })

      }
    );

  }







  async function downloadGamesHTML(){

    const f =
      await getFile(
        "games.html"
      );


    return {

      html:
      decodeURIComponent(
        escape(
          atob(
            f.content.replace(/\n/g,"")
          )
        )
      ),


      sha:f.sha

    };

  }







  async function commitGamesHTML(
    updatedHtml,
    sha
  ){

    return putFile(

      "games.html",

      updatedHtml,

      "Update games from admin panel",

      sha

    );

  }







  async function downloadNotifications(){

    const f =
      await getFile(
        "games.html"
      );


    return {

      html:
      decodeURIComponent(
        escape(
          atob(
            f.content.replace(/\n/g,"")
          )
        )
      ),


      sha:f.sha

    };

  }







  async function commitNotifications(
    updatedHtml,
    sha
  ){

    return putFile(

      "games.html",

      updatedHtml,

      "Update site notification from admin panel",

      sha

    );

  }







  global.SFCGitHub = {

    login,

    logout,

    getCurrentUser,

    downloadGamesHTML,

    commitGamesHTML,

    downloadNotifications,

    commitNotifications,

    hasToken: () =>
      !!auth().access_token,

    settings

  };


})(window);
