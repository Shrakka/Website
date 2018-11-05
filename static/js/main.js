/*function clock() {
    var now = new Date();
    var h = now.getHours();
    var m = now.getMinutes();
    var s = now.getSeconds();
    m = addZero(m);
    s = addZero(s);
    document.getElementById('clock').innerHTML = h + ":" + m + ":" + s;
    var t = setTimeout(clock, 500);
};

function addZero(i) {
    if (i < 10) { i = "0" + i }
    return i;
};


$(document).ready(function() {

    $(".big-image").fancybox({
        helpers: {
            title: {
                type: 'float'
            }
        }
    });

});
*/

/** Fonction basculant la visibilité d'un élément dom
* @parameter anId string l'identificateur de la cible à montrer, cacher
*/
function toggle(anId, anotherId)
{
    node = document.getElementById(anId);
    //otherNode = document.getElementById(anotherId);

    if (node.style.visibility=="hidden")
    {
        // Contenu caché, le montrer
        node.style.visibility = "visible";
        node.style.height = "auto";         // Optionnel rétablir la hauteur

        node.style.display = 'none';

        console.log('bahbah');

       // otherNode.style.visibility = "hidden";
       // otherNode.style.height = "0";

    }
    else
    {
        // Contenu visible, le cacher
        node.style.visibility = "hidden";
        node.style.height = "0";            // Optionnel libérer l'espace

        node.style.display = 'none';

      //  otherNode.style.visibility = "visible";
      //  othernode.style.height = "auto"; 
    }
}

