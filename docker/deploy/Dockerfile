FROM docker.niartifactory.maninvestments.com/base/numeric-python:27-1-onbuild
MAINTAINER Man | Numeric Investments

ARG WORKDIR=grail
ENV LOG_CONFIG=/grail/log_app.cfg

RUN yum clean all \
  ; yum -y install --nogpgcheck \

    liberation-sans-fonts.noarch \
    nodejs.x86_64 \

  ; yum clean all \
  ; rm -rf /var/{cache,lib}/{yum,apt,dpkg,cache,log}/ \
  ; rpm --rebuilddb

COPY . /$WORKDIR
WORKDIR /$WORKDIR
RUN chown $USERID:$GROUPID -R .

USER $USER
RUN for i in requirements.*; do pip install --no-cache-dir -r $i; done \
  ; python setup.py develop \
  ; python setup.grail_gen.py develop

WORKDIR /$WORKDIR/grail

EXPOSE 9200
ENTRYPOINT [ "tini", "--" ]
CMD ["sh", "entrypoint.sh"]
