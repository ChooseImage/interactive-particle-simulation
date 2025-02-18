// ...existing code...

function updateVideoPlanes() {
  const scrollY = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const scrollFraction = scrollY / maxScroll;

  videoPlanes.forEach((plane, index) => {
    plane.position.z = -200 + scrollFraction * 250; // Update position based on scroll
  });

  if (videoPlanes.length < 7 && videoPlanes.length < 13) {
    // Stop spawning new planes when count reaches 13
    createVideoPlane();
  }
}

// ...existing code...
